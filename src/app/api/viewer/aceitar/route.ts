import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { consultarPessoaPorCPF } from "@/lib/consulta";

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
    const { viewerId, documentId, cpfs } = body as {
      viewerId?: string;
      documentId?: string;
      cpfs?: string[];
    };

    if (!viewerId || !documentId || !Array.isArray(cpfs) || cpfs.length === 0) {
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
    if (!["pending", "manual_review"].includes(doc.status)) {
      return NextResponse.json({ error: "Documento já foi processado." }, { status: 409 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    const providerReady =
      settings?.api_provider === "supremo" || (!!settings?.api_url && !!settings?.api_token);
    if (settingsError || !providerReady) {
      return NextResponse.json({ error: "API de consulta não configurada." }, { status: 400 });
    }

    // Um documento (ex: PDF de várias páginas) pode ter mais de uma pessoa —
    // processa cada CPF informado e registra cada tentativa no histórico,
    // pra o admin poder ver depois quem confirmou o quê.
    const results: CpfResult[] = [];
    for (const cpf of cpfs) {
      const result = await consultarPessoaPorCPF(supabase, cpf, [documentId], settings);
      results.push({
        cpf,
        ok: result.ok,
        duplicate: result.duplicate ?? false,
        message: result.message,
      });
      await supabase.from("document_reviews").insert({
        document_id: documentId,
        viewer_id: viewerId,
        cpf,
        action: "accepted",
        person_id: result.personId ?? null,
      });
    }

    const anySuccess = results.some((r) => r.ok);
    if (!anySuccess) {
      const anyDuplicate = results.some((r) => r.duplicate);
      return NextResponse.json({ error: results[0]?.message, duplicate: anyDuplicate, results }, {
        status: anyDuplicate ? 409 : 400,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
