import { SupabaseClient } from "@supabase/supabase-js";

export const MODELO_IA_PADRAO = "claude-sonnet-4-6";

// Chave da Anthropic fica em settings (preenchida em Configurações no admin).
// Só o servidor lê — nunca vai pro navegador.
export async function getIaConfig(
  supabase: SupabaseClient
): Promise<{ apiKey: string; modelo: string } | null> {
  const { data } = await supabase
    .from("settings")
    .select("anthropic_api_key, anthropic_modelo")
    .eq("id", 1)
    .single();
  const apiKey = data?.anthropic_api_key?.trim();
  if (!apiKey) return null;
  const modelo =
    data?.anthropic_modelo && /^claude/i.test(data.anthropic_modelo) ? data.anthropic_modelo.trim() : MODELO_IA_PADRAO;
  return { apiKey, modelo };
}
