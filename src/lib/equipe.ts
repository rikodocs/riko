import { SupabaseClient } from "@supabase/supabase-js";
import type { ViewerRole } from "./viewer-session";

export interface Viewer {
  id: string;
  name: string;
  role: ViewerRole;
  moderador_id: string | null;
}

// Lê o viewer no servidor (a sessão do navegador é só conveniência).
export async function getViewer(supabase: SupabaseClient, viewerId: string | undefined): Promise<Viewer | null> {
  if (!viewerId) return null;
  const { data } = await supabase
    .from("viewer_users")
    .select("id, name, role, active, moderador_id")
    .eq("id", viewerId)
    .single();
  if (!data || !data.active) return null;
  return {
    id: data.id,
    name: data.name,
    role: data.role === "moderador" ? "moderador" : "operador",
    moderador_id: data.moderador_id ?? null,
  };
}

// Moderador da equipe de quem chama: moderador -> ele mesmo; operador -> o dele.
export function equipeDe(v: Viewer): string | null {
  return v.role === "moderador" ? v.id : v.moderador_id;
}

export function centavosParaReais(c: number): string {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
