import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

export type StatusCaso = "draft" | "submitted" | "em_analise" | "aprovado" | "rejeitado";
const STATUS: StatusCaso[] = ["draft", "submitted", "em_analise", "aprovado", "rejeitado"];

// Casos de OPC (trazido da Mikey Ads): lista, marca resultado e exclui.
// Toda a equipe (moderadores e operadores) vê a mesma base.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, id, status, motivo, apenasAprovados } = body as {
      viewerId?: string;
      action?: "list" | "update" | "delete";
      id?: string;
      status?: string;
      motivo?: string;
      apenasAprovados?: boolean;
    };

    if (!(await getViewerRole(supabase, viewerId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    if (action === "list") {
      let q = supabase
        .from("opc_casos")
        .select("id, empresa, cnpj, dominio, status, motivo_recusa, respostas, created_at, autor:viewer_users!created_by(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (apenasAprovados) q = q.eq("status", "aprovado");
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: "Não consegui carregar os casos." }, { status: 500 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const casos = ((data as any[]) || []).map((c) => ({
        ...c,
        autor: Array.isArray(c.autor) ? c.autor[0] ?? null : c.autor,
      }));
      return NextResponse.json({ casos });
    }

    if (action === "update") {
      if (!id || !status || !STATUS.includes(status as StatusCaso)) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      }
      // O motivo só é escrito ao rejeitar — um caso corrigido e reenviado não
      // pode perder o motivo da recusa anterior (é o dado que diz o que reprovou).
      const patch: { status: string; motivo_recusa?: string | null; updated_at: string } = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === "rejeitado") patch.motivo_recusa = motivo?.trim() || null;
      const { error } = await supabase.from("opc_casos").update(patch).eq("id", id);
      if (error) return NextResponse.json({ error: "Não consegui atualizar o caso." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const { error } = await supabase.from("opc_casos").delete().eq("id", id);
      if (error) return NextResponse.json({ error: "Não consegui excluir o caso." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
