import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { buscarDadosBrutos } from "@/lib/consulta";

// Re-consulta o CPF de uma pessoa já cadastrada e atualiza os dados dela
// (usado quando o cadastro ficou com nome/dados em branco, ex: API fora do
// ar na hora da consulta original).
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { personId } = body as { personId?: string };

    if (!personId) {
      return NextResponse.json({ error: "personId obrigatório." }, { status: 400 });
    }

    const { data: person, error: personError } = await supabase
      .from("people")
      .select("id, cpf")
      .eq("id", personId)
      .single();

    if (personError || !person) {
      return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
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

    const lookup = await buscarDadosBrutos(person.cpf, settings);

    if (!lookup.ok || !lookup.fields) {
      return NextResponse.json({ error: lookup.message }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("people")
      .update({ ...lookup.fields, raw_data: lookup.rawData })
      .eq("id", personId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, person: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
