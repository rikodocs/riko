import { bloqueioModerador } from "@/lib/permissoes";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";

const MIKEY_URL = "https://www.mikeyads.io/api/equipe/proxy";

type MikeyProxy = {
  id: string; host: string; porta: number; login: string; senha: string; ip: string;
  protocolo: string; conexao: string; url: string; ref?: string; quem?: string;
};

// Cada fornecedor usa a própria chave (só em variável de ambiente).
const KEY_ENV: Record<string, string> = {
  riko: "MIKEYADS_API_KEY",
  hustleads: "MIKEYADS_API_KEY_HUSTLEADS",
};

async function providerOf(supabase: ReturnType<typeof createServerClient>, viewerId: string) {
  const { data: v } = await supabase.from("viewer_users").select("*").eq("id", viewerId).single();
  let provider = v?.proxy_provider as string | null;
  if (!provider && v?.moderador_id) {
    const { data: m } = await supabase.from("viewer_users").select("proxy_provider").eq("id", v.moderador_id).single();
    provider = m?.proxy_provider ?? null;
  }
  return {
    name: (v?.name as string) || "riko",
    provider: provider && KEY_ENV[provider] ? provider : "riko",
    lote: v?.role === "moderador" && v?.proxy_lote === true,
  };
}

async function mikey(provider: string, method: "POST" | "DELETE", query = "", body?: unknown) {
  const envName = KEY_ENV[provider] || KEY_ENV.riko;
  const key = process.env[envName];
  if (!key) return { status: 500, data: { ok: false, error: `Chave de proxy não configurada no servidor (${envName}).` } };
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

    const bloqueio = await bloqueioModerador(supabase, viewerId, "proxies");
    if (bloqueio) return bloqueio;
    const role = await getViewerRole(supabase, viewerId);
    if (!role) return NextResponse.json({ error: "Sessão inválida. Entre de novo." }, { status: 403 });
    const { name: quem, provider, lote: podeLote } = await providerOf(supabase, viewerId!);

    // Moderador enxerga ele + os operadores atrelados a ele; operador só ele mesmo.
    let equipe: { id: string; name: string }[] = [{ id: viewerId!, name: quem }];
    if (role === "moderador") {
      const { data: ops } = await supabase
        .from("viewer_users").select("id, name").eq("role", "operador").eq("moderador_id", viewerId!).order("name");
      equipe = equipe.concat((ops || []) as { id: string; name: string }[]);
    }
    const idsEquipe = equipe.map((e) => e.id);

    if (action === "list") {
      const { data, error } = await supabase
        .from("proxies").select("*").eq("provider", provider).in("viewer_id", idsEquipe)
        .order("created_at", { ascending: false }).limit(500);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ proxies: data || [], equipe: role === "moderador" ? equipe : [], podeLote });
    }

    if (action === "gerar") {
      // Sem permissão de lote: um por vez, com intervalo mínimo entre pedidos.
      if (body.lote && !podeLote) {
        return NextResponse.json({ error: "Seu acesso não permite gerar em lote." }, { status: 403 });
      }
      if (!podeLote) {
        const { data: ultimo } = await supabase
          .from("proxies").select("created_at").eq("viewer_id", viewerId!)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        const espera = ultimo ? 10000 - (Date.now() - new Date(ultimo.created_at).getTime()) : 0;
        if (espera > 0) {
          return NextResponse.json({ error: `Aguarde ${Math.ceil(espera / 1000)}s pra gerar outro.` }, { status: 429 });
        }
      }

      const ref = viewerId!;
      const { status, data } = await mikey(provider, "POST", "", { ref, quem });
      if (status !== 200 || !data?.ok || !data.proxy) {
        return NextResponse.json({ error: mikeyError(status, data?.error || "Não foi possível gerar o proxy.") }, { status: status === 503 ? 503 : 502 });
      }
      const p = data.proxy as MikeyProxy;
      const row = {
        id: p.id, viewer_id: viewerId, viewer_name: quem, ref: null,
        host: p.host, porta: p.porta, login: p.login, senha: p.senha, ip: p.ip,
        protocolo: p.protocolo || "socks5", conexao: p.conexao, url: p.url, status: "ativo", provider,
      };
      const { data: saved, error } = await supabase.from("proxies").insert(row).select().single();
      if (error) {
        // Não deixa proxy órfão na Mikey Ads se não conseguimos salvar
        await mikey(provider, "DELETE", `?id=${encodeURIComponent(p.id)}`);
        return NextResponse.json({ error: "Erro ao salvar o proxy. Tente de novo." }, { status: 500 });
      }
      return NextResponse.json({ proxy: saved });
    }

    if (action === "liberar") {
      const id = String(body.id || "");
      const { data: px } = await supabase.from("proxies").select("id, viewer_id, status, provider").eq("id", id).maybeSingle();
      if (!px) return NextResponse.json({ error: "Proxy não encontrado." }, { status: 404 });
      if (px.provider !== provider || !idsEquipe.includes(px.viewer_id)) {
        return NextResponse.json({ error: "Esse proxy não é seu nem da sua equipe." }, { status: 403 });
      }
      if (px.status === "liberado") return NextResponse.json({ ok: true });

      const { status, data } = await mikey(provider, "DELETE", `?id=${encodeURIComponent(id)}`);
      // 404 na Mikey = já não existe lá; marca como liberado mesmo assim
      if (!(status === 200 && data?.ok) && status !== 404) {
        return NextResponse.json({ error: mikeyError(status, data?.error || "Não foi possível liberar o proxy.") }, { status: 502 });
      }
      await supabase.from("proxies").update({ status: "liberado", liberado_em: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    if (action === "apagar") {
      if (role !== "moderador") return NextResponse.json({ error: "Só o moderador pode apagar proxies." }, { status: 403 });
      const id = String(body.id || "");
      const { data: px } = await supabase.from("proxies").select("id, viewer_id, status, provider").eq("id", id).maybeSingle();
      if (!px) return NextResponse.json({ ok: true });
      if (px.provider !== provider || !idsEquipe.includes(px.viewer_id)) {
        return NextResponse.json({ error: "Esse proxy não é seu nem da sua equipe." }, { status: 403 });
      }
      // Sempre derruba o proxy na Mikey Ads antes de apagar (404 = já não existe lá).
      // Se a Mikey não confirmar, não apaga: o proxy continuaria funcionando.
      const { status, data } = await mikey(provider, "DELETE", `?id=${encodeURIComponent(id)}`);
      if (!(status === 200 && data?.ok) && status !== 404) {
        return NextResponse.json({ error: mikeyError(status, data?.error || "Não foi possível desativar o proxy. Nada foi apagado.") }, { status: 502 });
      }
      const { error } = await supabase.from("proxies").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
