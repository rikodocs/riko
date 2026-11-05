import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Abas do painel do moderador que o admin liga/desliga por moderador.
// Coluna em viewer_users: acesso_<chave> (default true). Operador não é afetado.
export const PERMISSOES = [
  { chave: "docs", label: "Docs" },
  { chave: "sites", label: "Sites" },
  { chave: "ferramentas", label: "Ferramentas" },
  { chave: "equipe", label: "Equipe" },
  { chave: "proxies", label: "Proxies" },
] as const;

export type Permissao = (typeof PERMISSOES)[number]["chave"];

export async function bloqueioModerador(
  supabase: SupabaseClient,
  viewerId: string | null | undefined,
  perm: Permissao
): Promise<NextResponse | null> {
  if (!viewerId) return null;
  const { data } = await supabase.from("viewer_users").select("*").eq("id", viewerId).maybeSingle();
  if (data?.role === "moderador" && data[`acesso_${perm}`] === false) {
    return NextResponse.json({ error: "Seu acesso não inclui essa área." }, { status: 403 });
  }
  return null;
}
