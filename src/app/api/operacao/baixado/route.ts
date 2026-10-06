import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

// Operador baixou os documentos: marca como "downloaded". Só mexe nos que
// estão atribuídos a ele e ainda não baixados.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentIds } = body as { viewerId?: string; documentIds?: string[] };

    if (!viewerId || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    if ((await getViewerRole(supabase, viewerId)) !== "operador") {
      return NextResponse.json({ error: "Acesso restrito a operadores." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("documents")
      .update({ status: "downloaded", downloaded_at: new Date().toISOString() })
      .in("id", documentIds)
      .eq("assigned_to", viewerId)
      .eq("status", "available")
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, marked: data?.length || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
