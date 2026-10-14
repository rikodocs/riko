import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, name, typeId, operatorId } = body as {
      viewerId?: string;
      action?: "list" | "create" | "delete" | "assign-operator";
      name?: string;
      typeId?: string;
      operatorId?: string;
    };

    if (!viewerId) return NextResponse.json({ error: "Sem viewerId." }, { status: 400 });

    const role = await getViewerRole(supabase, viewerId);
    if (role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
    }

    if (action === "list") {
      const [{ data: types }, { data: operators }] = await Promise.all([
        supabase.from("cnpj_types").select("id, name, created_at").order("name"),
        supabase
          .from("viewer_users")
          .select("id, name, cnpj_type_id")
          .eq("role", "operador")
          .eq("active", true)
          .order("name"),
      ]);

      const counts: Record<string, number> = {};
      if (types && types.length > 0) {
        for (const t of types) {
          const { count } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("cnpj_type_id", t.id)
            .eq("status", "available")
            .is("assigned_to", null);
          counts[t.id] = count || 0;
        }
      }
      const { count: semTipo } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .is("cnpj_type_id", null)
        .eq("status", "available")
        .is("assigned_to", null);
      counts["__none__"] = semTipo || 0;

      return NextResponse.json({ types: types || [], operators: operators || [], counts });
    }

    if (action === "create") {
      if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
      const { data, error } = await supabase.from("cnpj_types").insert({ name: name.trim() }).select("id, name").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ type: data });
    }

    if (action === "delete") {
      if (!typeId) return NextResponse.json({ error: "typeId é obrigatório." }, { status: 400 });
      await supabase.from("documents").update({ cnpj_type_id: null }).eq("cnpj_type_id", typeId);
      await supabase.from("viewer_users").update({ cnpj_type_id: null }).eq("cnpj_type_id", typeId);
      const { error } = await supabase.from("cnpj_types").delete().eq("id", typeId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "assign-operator") {
      if (!operatorId) return NextResponse.json({ error: "operatorId é obrigatório." }, { status: 400 });
      const { error } = await supabase
        .from("viewer_users")
        .update({ cnpj_type_id: typeId || null })
        .eq("id", operatorId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
