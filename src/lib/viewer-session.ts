const STORAGE_KEY = "viewer_auth";

export interface ViewerSession {
  id: string;
  name: string;
}

export function getViewerSession(): ViewerSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ViewerSession;
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
