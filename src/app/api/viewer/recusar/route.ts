import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId, cpf } = body as {
      viewerId?: string;
      documentId?: string;
      cpf?: string;
    };

    if (!viewerId || !documentId) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, assigned_to, status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.assigned_to !== viewerId) {
      return NextResponse.json({ error: "Documento não está atribuído a você." }, { status: 403 });
    }
    if (!["pending", "manual_review"].includes(doc.status)) {
      return NextResponse.json({ error: "Documento já foi processado." }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ assigned_to: null, assigned_at: null })
      .eq("id", documentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("document_reviews").insert({
      document_id: documentId,
      viewer_id: viewerId,
      cpf: cpf || null,
      action: "rejected",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
