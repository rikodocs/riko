import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer, equipeDe } from "@/lib/equipe";

type PorProduto = { produto_id: string; titulo: string; contas: number; gerado_centavos: number; taxa_centavos: number };

type Pagamento = { id: string; valor_centavos: number; obs: string | null; created_at: string };

type ResumoOperador = {
  operador_id: string;
  nome: string;
  contas: number;
  novas: number;
  gerado_centavos: number;
  pago_centavos: number;
  a_receber_centavos: number;
  por_produto: PorProduto[];
  pagamentos: Pagamento[];
};

// Financeiro moderador -> operador.
//   a receber = soma(valor_centavos das contas subidas) - pagamentos
//   O valor de cada conta é congelado no upload (taxa daquela hora).
// Ações: resumo (ambos), taxa (mod), pagar (mod), estornar (mod).
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, operadorId, produtoId, centavos, obs, pagamentoId } = body as {
      viewerId?: string;
      action?: "resumo" | "taxa" | "pagar" | "estornar";
      operadorId?: string;
      produtoId?: string;
      centavos?: number;
      obs?: string;
      pagamentoId?: string;
    };

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    const modId = equipeDe(viewer);
    if (!modId) return NextResponse.json({ error: "Você ainda não está ligado a um moderador." }, { status: 400 });

    async function resumoDe(operadores: { id: string; name: string }[]): Promise<ResumoOperador[]> {
      const ids = operadores.map((o) => o.id);
      if (ids.length === 0) return [];
      const [{ data: contas }, { data: pags }, { data: taxas }, { data: produtos }] = await Promise.all([
        supabase.from("contas").select("operador_id, produto_id, valor_centavos, status").eq("moderador_id", modId!).in("operador_id", ids),
        supabase.from("pagamentos_operador").select("id, operador_id, valor_centavos, obs, created_at").eq("moderador_id", modId!).in("operador_id", ids).order("created_at", { ascending: false }),
        supabase.from("taxas_operador").select("operador_id, produto_id, valor_centavos").in("operador_id", ids),
        supabase.from("produtos").select("id, titulo").eq("moderador_id", modId!),
      ]);
      const tituloDe = new Map((produtos || []).map((p) => [p.id, p.titulo as string]));
      return operadores.map((op) => {
        const minhas = (contas || []).filter((c) => c.operador_id === op.id);
        const porProd = new Map<string, PorProduto>();
        for (const c of minhas) {
          const e = porProd.get(c.produto_id) ?? {
            produto_id: c.produto_id,
            titulo: tituloDe.get(c.produto_id) ?? "—",
            contas: 0,
            gerado_centavos: 0,
            taxa_centavos: 0,
          };
          e.contas += 1;
          e.gerado_centavos += c.valor_centavos || 0;
          porProd.set(c.produto_id, e);
        }
        for (const t of taxas || []) {
          if (t.operador_id !== op.id) continue;
          const e = porProd.get(t.produto_id) ?? {
            produto_id: t.produto_id,
            titulo: tituloDe.get(t.produto_id) ?? "—",
            contas: 0,
            gerado_centavos: 0,
            taxa_centavos: 0,
          };
          e.taxa_centavos = t.valor_centavos;
          porProd.set(t.produto_id, e);
        }
        const pagamentos = (pags || []).filter((p) => p.operador_id === op.id).map(({ id, valor_centavos, obs, created_at }) => ({ id, valor_centavos, obs, created_at }));
        const gerado = minhas.reduce((a, c) => a + (c.valor_centavos || 0), 0);
        const pago = pagamentos.reduce((a, p) => a + p.valor_centavos, 0);
        return {
          operador_id: op.id,
          nome: op.name,
          contas: minhas.length,
          novas: minhas.filter((c) => c.status === "nova").length,
          gerado_centavos: gerado,
          pago_centavos: pago,
          a_receber_centavos: gerado - pago,
          por_produto: [...porProd.values()].sort((a, b) => a.titulo.localeCompare(b.titulo)),
          pagamentos,
        };
      });
    }

    if (action === "resumo") {
      if (viewer.role === "operador") {
        const [r] = await resumoDe([{ id: viewer.id, name: viewer.name }]);
        return NextResponse.json({ eu: r });
      }
      const { data: ops } = await supabase
        .from("viewer_users")
        .select("id, name, active")
        .eq("role", "operador")
        .eq("moderador_id", modId)
        .order("name");
      const operadores = await resumoDe((ops || []).map((o) => ({ id: o.id, name: o.name })));
      const { data: produtos } = await supabase.from("produtos").select("id, titulo, ativo").eq("moderador_id", modId).order("titulo");
      return NextResponse.json({ operadores, produtos: produtos || [] });
    }

    if (viewer.role !== "moderador") {
      return NextResponse.json({ error: "Só o moderador altera o financeiro." }, { status: 403 });
    }

    // Operador tem que ser da equipe
    async function operadorDaEquipe(id: string | undefined) {
      if (!id) return false;
      const { data } = await supabase.from("viewer_users").select("id").eq("id", id).eq("role", "operador").eq("moderador_id", modId).maybeSingle();
      return !!data;
    }

    if (action === "taxa") {
      if (!(await operadorDaEquipe(operadorId)) || !produtoId) {
        return NextResponse.json({ error: "Operador ou produto inválido." }, { status: 400 });
      }
      const v = Math.round(Number(centavos));
      if (!Number.isFinite(v) || v < 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      const { error } = await supabase
        .from("taxas_operador")
        .upsert({ operador_id: operadorId, produto_id: produtoId, valor_centavos: v, updated_at: new Date().toISOString() }, { onConflict: "operador_id,produto_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // Mudar a taxa vale pras próximas contas. Só as que ficaram em R$ 0,00
      // por falta de taxa na hora do upload recebem a nova (igual na Mikey Ads).
      await supabase
        .from("contas")
        .update({ valor_centavos: v })
        .eq("operador_id", operadorId)
        .eq("produto_id", produtoId)
        .eq("valor_centavos", 0);
      return NextResponse.json({ ok: true });
    }

    if (action === "pagar") {
      if (!(await operadorDaEquipe(operadorId))) return NextResponse.json({ error: "Operador inválido." }, { status: 400 });
      const v = Math.round(Number(centavos));
      if (!Number.isFinite(v) || v <= 0) return NextResponse.json({ error: "Informe um valor pago." }, { status: 400 });
      const { error } = await supabase
        .from("pagamentos_operador")
        .insert({ moderador_id: modId, operador_id: operadorId, valor_centavos: v, obs: (obs ?? "").trim() || null });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "estornar") {
      if (!pagamentoId) return NextResponse.json({ error: "Pagamento inválido." }, { status: 400 });
      const { error } = await supabase.from("pagamentos_operador").delete().eq("id", pagamentoId).eq("moderador_id", modId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
