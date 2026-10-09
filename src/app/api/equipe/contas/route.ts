import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer, equipeDe } from "@/lib/equipe";
import { contasParaXlsxBase64, type ContaExport } from "@/lib/contas/export-xlsx";

// Contas da equipe.
//   list   — operador: as dele; moderador: todas da equipe (com quem subiu)
//   baixar — só moderador: devolve .xlsx (formato AdsPower) e marca como baixadas
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, ids, produtoId, operadorId, apenasNovas, marcar } = body as {
      viewerId?: string;
      action?: "list" | "baixar";
      ids?: string[];
      produtoId?: string;
      operadorId?: string;
      apenasNovas?: boolean;
      marcar?: boolean;
    };

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    const modId = equipeDe(viewer);
    if (!modId) {
      return NextResponse.json({ error: "Você ainda não está ligado a um moderador." }, { status: 400 });
    }

    if (action === "list") {
      let q = supabase
        .from("contas")
        .select("id, produto_id, source_key, cnpj, login, status, baixada_em, valor_centavos, created_at, produto:produtos(titulo), operador:viewer_users!operador_id(name)")
        .eq("moderador_id", modId)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (viewer.role === "operador") q = q.eq("operador_id", viewer.id);
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contas = ((data as any[]) || []).map((c) => ({
        ...c,
        produto: Array.isArray(c.produto) ? c.produto[0]?.titulo ?? null : c.produto?.titulo ?? null,
        operador: Array.isArray(c.operador) ? c.operador[0]?.name ?? null : c.operador?.name ?? null,
      }));
      return NextResponse.json({ contas });
    }

    if (action === "baixar") {
      if (viewer.role !== "moderador") {
        return NextResponse.json({ error: "Só o moderador baixa as contas." }, { status: 403 });
      }
      let q = supabase
        .from("contas")
        .select("id, source_key, login, senha, dois_fatores, cookies, proxy, cnpj, ua, import_extra")
        .eq("moderador_id", modId)
        .order("created_at", { ascending: true });
      if (Array.isArray(ids) && ids.length > 0) q = q.in("id", ids);
      if (produtoId) q = q.eq("produto_id", produtoId);
      if (operadorId) q = q.eq("operador_id", operadorId);
      if (apenasNovas !== false) q = q.eq("status", "nova");
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const contas = (data || []) as (ContaExport & { id: string })[];
      if (contas.length === 0) {
        return NextResponse.json({ error: "Nenhuma conta pra baixar com esse filtro." }, { status: 404 });
      }

      const xlsx = await contasParaXlsxBase64(contas);

      if (marcar !== false) {
        await supabase
          .from("contas")
          .update({ status: "baixada", baixada_em: new Date().toISOString() })
          .in("id", contas.map((c) => c.id))
          .eq("status", "nova");
      }

      return NextResponse.json({ ok: true, xlsx, count: contas.length });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
