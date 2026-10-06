import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

// Moderador distribui N documentos aprovados (estoque livre) pra um operador.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, operatorId, amount } = body as {
      viewerId?: string;
      operatorId?: string;
      amount?: number;
    };

    if (!viewerId || !operatorId || typeof amount !== "number" || amount < 1) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    if ((await getViewerRole(supabase, viewerId)) !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a moderadores." }, { status: 403 });
    }
    if ((await getViewerRole(supabase, operatorId)) !== "operador") {
      return NextResponse.json({ error: "Operador inválido ou inativo." }, { status: 400 });
    }

    const { data: available } = await supabase
      .from("documents")
      .select("id")
      .eq("status", "available")
      .is("assigned_to", null)
      .order("created_at", { ascending: true })
      .limit(Math.floor(amount));

    if (!available || available.length === 0) {
      return NextResponse.json({ error: "Nenhum documento aprovado disponível." }, { status: 400 });
    }

    // Condicional: se outro moderador atribuiu os mesmos no meio do caminho,
    // só os que ainda estavam livres entram.
    const { data: assigned, error } = await supabase
      .from("documents")
      .update({ assigned_to: operatorId, assigned_at: new Date().toISOString() })
      .in("id", available.map((d) => d.id))
      .eq("status", "available")
      .is("assigned_to", null)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assigned: assigned?.length || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
