import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

// Recusa do moderador: o documento vira "rejected_mod" e fica anotado quem
// recusou e por quê. Nada é apagado do Storage.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId, cpf, reason } = body as {
      viewerId?: string;
      documentId?: string;
      cpf?: string;
      reason?: string;
    };

    if (!viewerId || !documentId) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    if ((await getViewerRole(supabase, viewerId)) !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a moderadores." }, { status: 403 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, status, review_claimed_by")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.status !== "pending_review") {
      return NextResponse.json({ error: "Este documento já foi moderado." }, { status: 409 });
    }
    if (doc.review_claimed_by !== viewerId) {
      return NextResponse.json({ error: "Este documento está com outro moderador." }, { status: 409 });
    }

    const rejectReason = reason === "duplicate" ? "duplicate" : "invalid";

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "rejected_mod",
        reject_reason: rejectReason,
        cpf_extracted: cpf || null,
        moderated_by: viewerId,
        moderated_at: new Date().toISOString(),
        review_claimed_by: null,
        review_claimed_at: null,
      })
      .eq("id", documentId)
      .eq("status", "pending_review");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("document_reviews").insert({
      document_id: documentId,
      viewer_id: viewerId,
      cpf: cpf || null,
      action: "rejected",
      reason: rejectReason === "duplicate" ? "duplicate" : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
