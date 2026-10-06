import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

// Trava de revisão expira depois disso — se o moderador fechou a aba no meio,
// outro moderador consegue pegar o documento.
const CLAIM_TTL_MINUTES = 15;

// Devolve o próximo documento pendente pra este moderador revisar, travando
// ele pra ninguém mais pegar ao mesmo tempo. Se ele já tinha um travado,
// devolve esse mesmo.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { viewerId } = (await request.json()) as { viewerId?: string };

    if ((await getViewerRole(supabase, viewerId)) !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a moderadores." }, { status: 403 });
    }

    // Solta travas velhas
    const cutoff = new Date(Date.now() - CLAIM_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from("documents")
      .update({ review_claimed_by: null, review_claimed_at: null })
      .eq("status", "pending_review")
      .lt("review_claimed_at", cutoff);

    const { count: pending } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    // Já tem um comigo?
    const { data: mine } = await supabase
      .from("documents")
      .select("id, file_type, file_name")
      .eq("status", "pending_review")
      .eq("review_claimed_by", viewerId)
      .order("review_claimed_at", { ascending: true })
      .limit(1);

    if (mine && mine.length > 0) {
      // Renova a trava
      await supabase
        .from("documents")
        .update({ review_claimed_at: new Date().toISOString() })
        .eq("id", mine[0].id);
      return NextResponse.json({ doc: mine[0], pending: pending || 0 });
    }

    // Tenta travar o próximo livre. Atualização condicional: se outro
    // moderador travou no meio do caminho, o update não pega nada e tenta o
    // seguinte.
    const { data: candidates } = await supabase
      .from("documents")
      .select("id, file_type, file_name")
      .eq("status", "pending_review")
      .is("review_claimed_by", null)
      .order("created_at", { ascending: true })
      .limit(5);

    for (const c of candidates || []) {
      const { data: claimed } = await supabase
        .from("documents")
        .update({ review_claimed_by: viewerId, review_claimed_at: new Date().toISOString() })
        .eq("id", c.id)
        .eq("status", "pending_review")
        .is("review_claimed_by", null)
        .select("id, file_type, file_name");
      if (claimed && claimed.length > 0) {
        return NextResponse.json({ doc: claimed[0], pending: pending || 0 });
      }
    }

    return NextResponse.json({ doc: null, pending: pending || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
