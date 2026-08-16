import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { consultarPessoaPorCPF } from "@/lib/consulta";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId, cpf } = body as {
      viewerId?: string;
      documentId?: string;
      cpf?: string;
    };

    if (!viewerId || !documentId || !cpf) {
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

    if (settingsError || !settings?.api_url) {
      return NextResponse.json({ error: "API de consulta não configurada." }, { status: 400 });
    }

    const result = await consultarPessoaPorCPF(supabase, cpf, [documentId], settings);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, duplicate: result.duplicate ?? false },
        { status: result.duplicate ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
