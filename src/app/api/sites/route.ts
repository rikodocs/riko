import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";
import { parseSites } from "@/lib/sites";

// Moderador: vê tudo, adiciona e remove.
// Operador: vê só o que ele pegou e pega o próximo da fila (1 por vez).
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action, text, ids } = body as {
      viewerId?: string;
      action?: "list" | "add" | "delete" | "claim";
      text?: string;
      ids?: string[];
    };

    const role = await getViewerRole(supabase, viewerId);
    if (!role || !viewerId) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    async function countAvailable() {
      const { count } = await supabase
        .from("sites")
        .select("id", { count: "exact", head: true })
        .is("claimed_by", null);
      return count || 0;
    }

    if (action === "list") {
      const available = await countAvailable();

      if (role === "operador") {
        const { data, error } = await supabase
          .from("sites")
          .select("id, cnpj, url, claimed_at")
          .eq("claimed_by", viewerId)
          .order("claimed_at", { ascending: false })
          .limit(2000);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ sites: data || [], available });
      }

      const { data, error } = await supabase
        .from("sites")
        .select("id, cnpj, url, created_at, claimed_at, claimer:viewer_users!claimed_by(name)")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sites = ((data as any[]) || []).map((s) => ({
        ...s,
        claimer: Array.isArray(s.claimer) ? s.claimer[0] ?? null : s.claimer,
      }));
      return NextResponse.json({ sites, available });
    }

    if (action === "claim") {
      if (role !== "operador") {
        return NextResponse.json({ error: "Só operadores pegam sites." }, { status: 403 });
      }
      // Pega o mais antigo da fila. Atualização condicional (só se ainda
      // estiver livre): se outro operador pegou no mesmo instante, tenta o
      // próximo — nunca dois operadores ficam com o mesmo site.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: next } = await supabase
          .from("sites")
          .select("id")
          .is("claimed_by", null)
          .order("created_at", { ascending: true })
          .limit(1);
        if (!next || next.length === 0) {
          return NextResponse.json({ error: "Não há sites disponíveis na fila." }, { status: 404 });
        }
        const { data: claimed, error } = await supabase
          .from("sites")
          .update({ claimed_by: viewerId, claimed_at: new Date().toISOString() })
          .eq("id", next[0].id)
          .is("claimed_by", null)
          .select("id, cnpj, url, claimed_at");
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (claimed && claimed.length > 0) {
          return NextResponse.json({ ok: true, site: claimed[0], available: await countAvailable() });
        }
      }
      return NextResponse.json({ error: "Fila movimentada, tente de novo." }, { status: 409 });
    }

    if (role !== "moderador") {
      return NextResponse.json({ error: "Só moderadores podem alterar os sites." }, { status: 403 });
    }

    if (action === "add") {
      const parsed = parseSites(text || "");
      if (parsed.sites.length === 0) {
        return NextResponse.json(
          { error: "Não encontrei nenhum CNPJ + URL no texto.", invalid: parsed.invalid },
          { status: 400 }
        );
      }

      // Pula o que já existe (mesma URL)
      const { data: existing } = await supabase
        .from("sites")
        .select("url")
        .in("url", parsed.sites.map((s) => s.url));
      const existingSet = new Set((existing || []).map((r) => r.url.toLowerCase()));
      const fresh = parsed.sites.filter((s) => !existingSet.has(s.url.toLowerCase()));

      if (fresh.length > 0) {
        const { error } = await supabase
          .from("sites")
          .insert(fresh.map((s) => ({ cnpj: s.cnpj, url: s.url, created_by: viewerId })));
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        added: fresh.length,
        duplicates: parsed.sites.length - fresh.length,
        invalid: parsed.invalid,
      });
    }

    if (action === "delete") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Nada selecionado." }, { status: 400 });
      }
      const { error } = await supabase.from("sites").delete().in("id", ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
