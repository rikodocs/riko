import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

const MIKEY_URL = "https://www.mikeyads.io/api/equipe/proxy";

type MikeyProxy = {
  id: string; host: string; porta: number; login: string; senha: string; ip: string;
  protocolo: string; conexao: string; url: string; ref?: string; quem?: string;
};

async function mikey(method: "POST" | "DELETE", query = "", body?: unknown) {
  const key = process.env.MIKEYADS_API_KEY;
  if (!key) return { status: 500, data: { ok: false, error: "Chave da Mikey Ads não configurada no servidor (MIKEYADS_API_KEY)." } };
  try {
    const r = await fetch(`${MIKEY_URL}${query}`, {
      method,
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({ ok: false }));
    return { status: r.status, data };
  } catch {
    return { status: 0, data: { ok: false } };
  }
}

function mikeyError(status: number, fallback: string) {
  if (status === 0) return "Sem conexão com a Mikey Ads. Verifique a internet e tente de novo.";
  if (status === 401) return "Chave da Mikey Ads inválida (401). Avise o administrador.";
  if (status === 503) return "Nenhum IP livre no momento. Tente de novo em 1 minuto.";
  return fallback;
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, action } = body as { viewerId?: string; action?: string };

    const role = await getViewerRole(supabase, viewerId);
    if (!role) return NextResponse.json({ error: "Sessão inválida. Entre de novo." }, { status: 403 });

    if (action === "list") {
      let q = supabase.from("proxies").select("*").order("created_at", { ascending: false }).limit(300);
      if (role !== "moderador") q = q.eq("viewer_id", viewerId!);
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ proxies: data || [] });
    }

    if (action === "gerar") {
      const ref = String(body.ref || "").trim().slice(0, 200);
      if (!ref) return NextResponse.json({ error: "Informe o e-mail ou ID da conta que vai usar o proxy." }, { status: 400 });

      // Um proxy por conta: se já existe um ativo pra esse ref, devolve o mesmo.
      const { data: existente } = await supabase
        .from("proxies").select("*").eq("ref", ref).eq("status", "ativo").maybeSingle();
      if (existente) return NextResponse.json({ proxy: existente, reused: true });

      const { data: viewer } = await supabase.from("viewer_users").select("name").eq("id", viewerId!).single();
      const quem = viewer?.name || "riko";

      const { status, data } = await mikey("POST", "", { ref, quem });
      if (status !== 200 || !data?.ok || !data.proxy) {
        return NextResponse.json({ error: mikeyError(status, data?.error || "Não foi possível gerar o proxy.") }, { status: status === 503 ? 503 : 502 });
      }
      const p = data.proxy as MikeyProxy;
      const row = {
        id: p.id, viewer_id: viewerId, viewer_name: quem, ref,
        host: p.host, porta: p.porta, login: p.login, senha: p.senha, ip: p.ip,
        protocolo: p.protocolo || "socks5", conexao: p.conexao, url: p.url, status: "ativo",
      };
      const { data: saved, error } = await supabase.from("proxies").insert(row).select().single();
      if (error) {
        // Não deixa proxy órfão na Mikey Ads se não conseguimos salvar
        await mikey("DELETE", `?id=${encodeURIComponent(p.id)}`);
        return NextResponse.json({ error: "Erro ao salvar o proxy. Tente de novo." }, { status: 500 });
      }
      return NextResponse.json({ proxy: saved });
    }

    if (action === "liberar") {
      const id = String(body.id || "");
      const { data: px } = await supabase.from("proxies").select("id, viewer_id, status").eq("id", id).maybeSingle();
      if (!px) return NextResponse.json({ error: "Proxy não encontrado." }, { status: 404 });
      if (role !== "moderador" && px.viewer_id !== viewerId) {
        return NextResponse.json({ error: "Você só pode liberar os seus proxies." }, { status: 403 });
      }
      if (px.status === "liberado") return NextResponse.json({ ok: true });

      const { status, data } = await mikey("DELETE", `?id=${encodeURIComponent(id)}`);
      // 404 na Mikey = já não existe lá; marca como liberado mesmo assim
      if (!(status === 200 && data?.ok) && status !== 404) {
        return NextResponse.json({ error: mikeyError(status, data?.error || "Não foi possível liberar o proxy.") }, { status: 502 });
      }
      await supabase.from("proxies").update({ status: "liberado", liberado_em: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
