import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer } from "@/lib/equipe";
import { gerarCodigo6Digitos } from "@/lib/codigo-acesso";

// Operadores da equipe — o moderador cria e controla os dele sem depender do admin.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, id, name, active } = body as {
      viewerId?: string;
      action?: "list" | "add" | "update" | "novo_codigo" | "delete";
      id?: string;
      name?: string;
      active?: boolean;
    };

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer || viewer.role !== "moderador") {
      return NextResponse.json({ error: "Só moderadores gerenciam operadores." }, { status: 403 });
    }
    const modId = viewer.id;

    // Tenta alguns códigos até achar um livre (code é unique na tabela)
    async function inserirComCodigo(nome: string) {
      let lastError = "";
      for (let i = 0; i < 6; i++) {
        const code = gerarCodigo6Digitos();
        const { data, error } = await supabase
          .from("viewer_users")
          .insert({ name: nome, code, role: "operador", moderador_id: modId })
          .select("id, name, code, active")
          .single();
        if (!error && data) return { data };
        lastError = error?.message ?? "";
        if (!/code|duplicate|unique/i.test(lastError)) break;
      }
      return { error: lastError || "Não consegui gerar um código único." };
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("viewer_users")
        .select("id, name, code, active, created_at")
        .eq("role", "operador")
        .eq("moderador_id", modId)
        .order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ operadores: data || [] });
    }

    if (action === "add") {
      const nome = (name ?? "").trim();
      if (!nome) return NextResponse.json({ error: "Dê um nome pro operador." }, { status: 400 });
      const r = await inserirComCodigo(nome);
      if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
      return NextResponse.json({ ok: true, operador: r.data });
    }

    // Daqui pra baixo só mexe em operador DA EQUIPE
    if (!id) return NextResponse.json({ error: "Operador inválido." }, { status: 400 });
    const { data: alvo } = await supabase
      .from("viewer_users")
      .select("id")
      .eq("id", id)
      .eq("role", "operador")
      .eq("moderador_id", modId)
      .maybeSingle();
    if (!alvo) return NextResponse.json({ error: "Esse operador não é da sua equipe." }, { status: 403 });

    if (action === "update") {
      const patch: { name?: string; active?: boolean } = {};
      if (typeof name === "string" && name.trim()) patch.name = name.trim();
      if (typeof active === "boolean") patch.active = active;
      const { error } = await supabase.from("viewer_users").update(patch).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "novo_codigo") {
      let lastError = "";
      for (let i = 0; i < 6; i++) {
        const code = gerarCodigo6Digitos();
        const { error } = await supabase.from("viewer_users").update({ code }).eq("id", id);
        if (!error) return NextResponse.json({ ok: true, code });
        lastError = error.message;
        if (!/code|duplicate|unique/i.test(lastError)) break;
      }
      return NextResponse.json({ error: lastError || "Não consegui gerar um código novo." }, { status: 500 });
    }

    if (action === "delete") {
      // Só apaga quem não tem histórico — senão o certo é desativar.
      const conta = async (tabela: string, coluna: string) =>
        (await supabase.from(tabela).select("id", { count: "exact", head: true }).eq(coluna, id)).count || 0;
      const [contas, pagamentos, docs, sites] = await Promise.all([
        conta("contas", "operador_id"),
        conta("pagamentos_operador", "operador_id"),
        conta("documents", "assigned_to"),
        conta("sites", "claimed_by"),
      ]);
      const motivos = [
        contas && `${contas} conta(s) subida(s)`,
        pagamentos && `${pagamentos} pagamento(s)`,
        docs && `${docs} documento(s)`,
        sites && `${sites} site(s)`,
      ].filter(Boolean);
      if (motivos.length) {
        return NextResponse.json(
          { error: `Esse operador tem ${motivos.join(", ")}. Desative em vez de excluir, pra não perder o histórico.` },
          { status: 400 }
        );
      }
      await supabase.from("taxas_operador").delete().eq("operador_id", id);
      await supabase.from("document_reviews").delete().eq("viewer_id", id);
      const { error } = await supabase.from("viewer_users").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
