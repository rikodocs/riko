import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer, equipeDe } from "@/lib/equipe";

// Produtos (tipos de conta) do moderador. Operador só lista os do moderador dele.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, id, titulo, ativo } = body as {
      viewerId?: string;
      action?: "list" | "add" | "update" | "delete";
      id?: string;
      titulo?: string;
      ativo?: boolean;
    };

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    const modId = equipeDe(viewer);
    if (!modId) {
      return NextResponse.json({ error: "Você ainda não está ligado a um moderador. Peça pro admin ajustar em Usuários." }, { status: 400 });
    }

    if (action === "list") {
      let q = supabase.from("produtos").select("id, titulo, ativo, created_at").eq("moderador_id", modId).order("titulo");
      if (viewer.role === "operador") q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ produtos: data || [] });
    }

    if (viewer.role !== "moderador") {
      return NextResponse.json({ error: "Só o moderador mexe nos produtos." }, { status: 403 });
    }

    if (action === "add") {
      const t = (titulo ?? "").trim();
      if (!t) return NextResponse.json({ error: "Dê um nome pro produto." }, { status: 400 });
      const { data, error } = await supabase
        .from("produtos")
        .insert({ moderador_id: modId, titulo: t })
        .select("id, titulo, ativo, created_at")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, produto: data });
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
      const patch: { titulo?: string; ativo?: boolean } = {};
      if (typeof titulo === "string" && titulo.trim()) patch.titulo = titulo.trim();
      if (typeof ativo === "boolean") patch.ativo = ativo;
      const { error } = await supabase.from("produtos").update(patch).eq("id", id).eq("moderador_id", modId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
      const { count } = await supabase.from("contas").select("id", { count: "exact", head: true }).eq("produto_id", id);
      if (count && count > 0) {
        return NextResponse.json({ error: `Esse produto tem ${count} conta(s). Desative em vez de excluir.` }, { status: 400 });
      }
      await supabase.from("taxas_operador").delete().eq("produto_id", id);
      const { error } = await supabase.from("produtos").delete().eq("id", id).eq("moderador_id", modId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
