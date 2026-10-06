import { SupabaseClient } from "@supabase/supabase-js";
import type { ViewerRole } from "./viewer-session";

// Confere no servidor o papel de um viewer_users (a sessão do navegador é
// só conveniência — toda rota checa aqui antes de agir).
export async function getViewerRole(
  supabase: SupabaseClient,
  viewerId: string | undefined
): Promise<ViewerRole | null> {
  if (!viewerId) return null;
  const { data } = await supabase
    .from("viewer_users")
    .select("role, active")
    .eq("id", viewerId)
    .single();
  if (!data || !data.active) return null;
  return data.role === "moderador" ? "moderador" : "operador";
}
