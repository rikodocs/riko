import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { buscarDadosCPF } from "@/lib/consulta";

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
      .select("id, review_claimed_by, status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    // Quem consulta agora é o moderador, no documento que ele travou pra revisar
    if (doc.status !== "pending_review") {
      return NextResponse.json({ error: "Este documento já foi moderado." }, { status: 409 });
    }
    if (doc.review_claimed_by !== viewerId) {
      return NextResponse.json({ error: "Este documento está com outro moderador." }, { status: 403 });
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

    // Só busca e devolve os dados — nada é gravado aqui. O viewer confirma
    // (ou corrige o CPF) antes de qualquer coisa ir pro banco.
    const results = [];
    for (const cpf of cpfs) {
      const lookup = await buscarDadosCPF(supabase, cpf, settings);
      results.push({
        cpf,
        ok: lookup.ok,
        duplicate: lookup.duplicate ?? false,
        message: lookup.message,
        fields: lookup.fields ?? null,
        rawData: lookup.rawData ?? null,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
