import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { salvarPessoaConsultada, type PersonFields } from "@/lib/consulta";

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

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, assigned_to, status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.assigned_to !== viewerId) {
      return NextResponse.json({ error: "Documento não está atribuído a você." }, { status: 403 });
    }
    if (doc.status !== "available") {
      return NextResponse.json({ error: "Documento já foi processado." }, { status: 409 });
    }

    // Os dados já foram buscados e mostrados pro viewer confirmar em
    // /api/viewer/consultar-preview — aqui só grava, re-checando duplicado
    // por segurança (pode ter mudado entre a prévia e a confirmação).
    const results: CpfResult[] = [];
    for (const entry of entries) {
      const result = await salvarPessoaConsultada(
        supabase,
        entry.cpf,
        [documentId],
        entry.fields,
        entry.rawData
      );
      results.push({
        cpf: entry.cpf,
        ok: result.ok,
        duplicate: result.duplicate ?? false,
        message: result.message,
      });
      await supabase.from("document_reviews").insert({
        document_id: documentId,
        viewer_id: viewerId,
        cpf: entry.cpf,
        action: "accepted",
        person_id: result.personId ?? null,
      });
    }

    const anySuccess = results.some((r) => r.ok);
    if (!anySuccess) {
      const anyDuplicate = results.some((r) => r.duplicate);
      return NextResponse.json(
        { error: results[0]?.message, duplicate: anyDuplicate, results },
        { status: anyDuplicate ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
