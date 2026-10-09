import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer, equipeDe } from "@/lib/equipe";

type ListaTexto = string[];

function limpar(lista: unknown): ListaTexto {
  if (!Array.isArray(lista)) return [];
  return lista.map((v) => String(v ?? "").trim()).filter(Boolean);
}

// Modelos (fichas): nome + palavras-chave + títulos + descrições, ligadas a um
// operador. Moderador cria/edita/exclui as dele; operador só lê as suas.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, id, nome, operadorId, palavrasChave, titulos, descricoes } = body as {
      viewerId?: string;
      action?: "list" | "add" | "update" | "delete";
      id?: string;
      nome?: string;
      operadorId?: string | null;
      palavrasChave?: unknown;
      titulos?: unknown;
      descricoes?: unknown;
    };

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    const modId = equipeDe(viewer);
    if (!modId) return NextResponse.json({ error: "Você ainda não está ligado a um moderador." }, { status: 400 });

    if (action === "list") {
      let q = supabase
        .from("modelos")
        .select("id, nome, operador_id, palavras_chave, titulos, descricoes, created_at, updated_at, operador:viewer_users!operador_id(name)")
        .eq("moderador_id", modId)
        .order("created_at", { ascending: false });
      if (viewer.role === "operador") q = q.eq("operador_id", viewer.id);
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelos = ((data as any[]) || []).map((m) => ({
        ...m,
        operador: Array.isArray(m.operador) ? m.operador[0]?.name ?? null : m.operador?.name ?? null,
      }));
      return NextResponse.json({ modelos });
    }

    if (viewer.role !== "moderador") {
      return NextResponse.json({ error: "Só o moderador mexe nos modelos." }, { status: 403 });
    }

    // Operador informado tem que ser da equipe (ou nenhum)
    async function operadorValido(opId: string | null | undefined): Promise<string | null> {
      if (!opId) return null;
      const { data } = await supabase
        .from("viewer_users")
        .select("id")
        .eq("id", opId)
        .eq("role", "operador")
        .eq("moderador_id", modId)
        .maybeSingle();
      if (!data) throw new Error("Esse operador não é da sua equipe.");
      return data.id;
    }

    if (action === "add" || action === "update") {
      const n = (nome ?? "").trim();
      if (!n) return NextResponse.json({ error: "Dê um nome pro modelo." }, { status: 400 });
      let opId: string | null;
      try {
        opId = await operadorValido(operadorId);
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
      const payload = {
        nome: n,
        operador_id: opId,
        palavras_chave: limpar(palavrasChave),
        titulos: limpar(titulos),
        descricoes: limpar(descricoes),
        updated_at: new Date().toISOString(),
      };

      if (action === "add") {
        const { data, error } = await supabase
          .from("modelos")
          .insert({ ...payload, moderador_id: modId })
          .select("id")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, id: data.id });
      }

      if (!id) return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
      const { error } = await supabase.from("modelos").update(payload).eq("id", id).eq("moderador_id", modId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
      const { error } = await supabase.from("modelos").delete().eq("id", id).eq("moderador_id", modId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
