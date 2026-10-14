import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { viewerId, typeId } = (await request.json()) as { viewerId?: string; typeId?: string };

    if (!viewerId) return NextResponse.json({ error: "Sem viewerId." }, { status: 400 });
    const role = await getViewerRole(supabase, viewerId);
    if (role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
    }
    if (!typeId) return NextResponse.json({ error: "typeId é obrigatório." }, { status: 400 });

    const { data, error } = await supabase
      .from("documents")
      .update({ cnpj_type_id: typeId })
      .eq("status", "available")
      .is("assigned_to", null)
      .is("cnpj_type_id", null)
      .select("id");

    const count = data?.length ?? 0;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: count || 0 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
