const STORAGE_KEY = "viewer_auth";

export type ViewerRole = "moderador" | "operador";

export interface ViewerSession {
  id: string;
  name: string;
  role: ViewerRole;
}

export function homeForRole(role: ViewerRole): string {
  return role === "moderador" ? "/moderador" : "/operacao";
}

export function getViewerSession(): ViewerSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ViewerSession>;
    // Sessão antiga (antes dos papéis) não tem role — força novo login
    if (!parsed.id || !parsed.name || !parsed.role) return null;
    return parsed as ViewerSession;
  } catch {
    return null;
  }
}

export function setViewerSession(session: ViewerSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearViewerSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
