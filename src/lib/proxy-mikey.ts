import type { createServerClient } from "@/lib/supabase";

const MIKEY_URL = "https://www.mikeyads.io/api/equipe/proxy";

// Cada fornecedor usa a própria chave (só em variável de ambiente).
export const KEY_ENV: Record<string, string> = {
  riko: "MIKEYADS_API_KEY",
  hustleads: "MIKEYADS_API_KEY_HUSTLEADS",
};

export async function mikey(provider: string, method: "POST" | "DELETE", query = "", body?: unknown) {
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

export const PRAZOS_DIAS = [1, 3, 7, 15, 30, 60, 90];

// Desativa na Mikey Ads os proxies vencidos e marca como "expirado".
export async function expirarVencidos(supabase: ReturnType<typeof createServerClient>, limite = 25) {
  const { data: vencidos } = await supabase
    .from("proxies").select("id, provider").eq("status", "ativo")
    .not("expira_em", "is", null).lte("expira_em", new Date().toISOString()).limit(limite);
  let feitos = 0;
  for (const px of vencidos || []) {
    const { status, data } = await mikey(px.provider || "riko", "DELETE", `?id=${encodeURIComponent(px.id)}`);
    if ((status === 200 && data?.ok) || status === 404) {
      await supabase.from("proxies").update({ status: "expirado", liberado_em: new Date().toISOString() }).eq("id", px.id);
      feitos++;
    }
  }
  return feitos;
}
