"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getViewerSession, clearViewerSession } from "@/lib/viewer-session";
import DocumentCard from "@/components/DocumentCard";

interface QueueDoc {
  id: string;
  file_type: string | null;
}

export default function PainelPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; name: string } | null>(null);
  const [queue, setQueue] = useState<QueueDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadQueue = useCallback(async (viewerId: string) => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_type")
      .eq("assigned_to", viewerId)
      .in("status", ["pending", "manual_review"])
      .order("assigned_at", { ascending: true });
    if (error) {
      setLoadError("Não foi possível carregar seus documentos. Tente novamente.");
    }
    setQueue(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getViewerSession();
    if (!s) {
      router.push("/");
      return;
    }
    setSession(s);
    loadQueue(s.id);
  }, [router, loadQueue]);

  function handleLogout() {
    clearViewerSession();
    router.push("/");
  }

  function handleDone() {
    if (session) loadQueue(session.id);
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden noise">
      <div className="absolute inset-0 grid-bg" />

      <header className="relative z-10 w-full max-w-xl flex items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="text-primary">R</span>
          <span className="text-text-primary">IKO</span>
        </span>
        <button onClick={handleLogout} className="btn-ghost text-xs">
          Sair
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6 pb-10">
        {loading ? (
          <p className="text-text-tertiary text-sm">Carregando...</p>
        ) : loadError ? (
          <div className="glass-static rounded-lg p-8 text-center max-w-sm">
            <p className="text-danger font-medium">{loadError}</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="glass-static rounded-lg p-8 text-center max-w-sm">
            <p className="text-text-primary font-medium mb-1">Nenhum documento disponível</p>
            <p className="text-text-tertiary text-sm">Aguarde novos documentos serem atribuídos a você.</p>
          </div>
        ) : (
          <DocumentCard doc={queue[0]} viewerId={session.id} viewerName={session.name} onDone={handleDone} />
        )}
      </main>
    </div>
  );
}
