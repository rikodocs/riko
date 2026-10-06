import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { salvarPessoaConsultada, type PersonFields } from "@/lib/consulta";
import { getViewerRole } from "@/lib/viewer-role";

interface CpfEntry {
  cpf: string;
  fields: PersonFields;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData: any;
}

interface CpfResult {
  cpf: string;
  ok: boolean;
  duplicate: boolean;
  message: string;
}

// Moderador confirmou os dados: salva a(s) pessoa(s) e o documento vai pro
// estoque ("available"), já com a pessoa vinculada.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId, entries } = body as {
      viewerId?: string;
      documentId?: string;
      entries?: CpfEntry[];
    };

    if (!viewerId || !documentId || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    if ((await getViewerRole(supabase, viewerId)) !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a moderadores." }, { status: 403 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, status, review_claimed_by")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.status !== "pending_review") {
      return NextResponse.json({ error: "Este documento já foi moderado." }, { status: 409 });
    }
    if (doc.review_claimed_by !== viewerId) {
      return NextResponse.json({ error: "Este documento está com outro moderador." }, { status: 409 });
    }

    const results: CpfResult[] = [];
    for (const entry of entries) {
      const result = await salvarPessoaConsultada(
        supabase,
        entry.cpf,
        [documentId],
        entry.fields,
        entry.rawData,
        { onSuccess: "available", onDuplicate: null }
      );
      results.push({
        cpf: entry.cpf,
        ok: result.ok,
        duplicate: result.duplicate ?? false,
        message: result.message,
      });
      if (result.ok) {
        await supabase.from("document_reviews").insert({
          document_id: documentId,
          viewer_id: viewerId,
          cpf: entry.cpf,
          action: "accepted",
          person_id: result.personId ?? null,
        });
      }
    }

    const anySuccess = results.some((r) => r.ok);
    if (!anySuccess) {
      const anyDuplicate = results.some((r) => r.duplicate);
      return NextResponse.json(
        { error: results[0]?.message, duplicate: anyDuplicate, results },
        { status: anyDuplicate ? 409 : 400 }
      );
    }

    await supabase
      .from("documents")
      .update({
        moderated_by: viewerId,
        moderated_at: new Date().toISOString(),
        review_claimed_by: null,
        review_claimed_at: null,
      })
      .eq("id", documentId);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
