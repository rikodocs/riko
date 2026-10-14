import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

// Estoque único de documentos aprovados: o operador puxa de lá (igual à fila
// de Sites), em vez de esperar o moderador distribuir.
//   consultar — só diz SE tem documento (o operador não vê o tamanho do estoque)
//   pegar     — reserva 1 documento por vez pro operador (atualização
//               condicional: se outro pegou no mesmo instante, tenta o próximo)
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action } = body as { viewerId?: string; action?: "consultar" | "pegar" };

    if (!viewerId || (await getViewerRole(supabase, viewerId)) !== "operador") {
      return NextResponse.json({ error: "Acesso restrito a operadores." }, { status: 403 });
    }

    // Busca o tipo de CNPJ atribuído a este operador (pode ser null = pega qualquer)
    const { data: viewer } = await supabase
      .from("viewer_users")
      .select("cnpj_type_id")
      .eq("id", viewerId)
      .single();
    const tipoCnpj = viewer?.cnpj_type_id || null;

    function queryDisponivel() {
      let q = supabase
        .from("documents")
        .select("id")
        .eq("status", "available")
        .is("assigned_to", null);
      if (tipoCnpj) q = q.eq("cnpj_type_id", tipoCnpj);
      return q;
    }

    async function temDisponivel() {
      const { data } = await queryDisponivel().limit(1);
      return (data?.length ?? 0) > 0;
    }

    if (action === "consultar") {
      return NextResponse.json({ disponivel: await temDisponivel() });
    }

    if (action === "pegar") {
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        const { data: livre } = await queryDisponivel()
          .order("created_at", { ascending: true })
          .limit(1);
        if (!livre || livre.length === 0) {
          return NextResponse.json({ error: "Nenhum documento disponível no momento." }, { status: 404 });
        }
        const { data: pego, error } = await supabase
          .from("documents")
          .update({ assigned_to: viewerId, assigned_at: new Date().toISOString() })
          .eq("id", livre[0].id)
          .eq("status", "available")
          .is("assigned_to", null)
          .select("id");
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (pego && pego.length > 0) {
          return NextResponse.json({ ok: true, disponivel: await temDisponivel() });
        }
      }
      return NextResponse.json({ error: "Muita gente pegando ao mesmo tempo. Tente de novo." }, { status: 409 });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
