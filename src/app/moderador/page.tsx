"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getViewerSession, clearViewerSession, homeForRole, type ViewerSession } from "@/lib/viewer-session";
import DocumentCard from "@/components/DocumentCard";
import SitesPanel from "@/components/SitesPanel";
import FerramentasPanel from "@/components/ia/FerramentasPanel";

interface QueueDoc {
  id: string;
  file_type: string | null;
  file_name?: string | null;
}

interface OperatorRow {
  id: string;
  name: string;
  code: string;
  in_hands: number;
  downloaded: number;
}

type Tab = "revisar" | "distribuir" | "sites" | "ferramentas";

export default function ModeradorPage() {
  const router = useRouter();
  const [session, setSession] = useState<ViewerSession | null>(null);
  const [tab, setTab] = useState<Tab>("revisar");

  // Revisar
  const [doc, setDoc] = useState<QueueDoc | null>(null);
  const [pending, setPending] = useState(0);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "danger"; text: string } | null>(null);
  const [doneCount, setDoneCount] = useState({ approved: 0, rejected: 0 });

  // Distribuir
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [stock, setStock] = useState(0);
  const [loadingOps, setLoadingOps] = useState(false);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignAmount, setAssignAmount] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadNext = useCallback(async (viewerId: string) => {
    setLoadingDoc(true);
    setQueueError(null);
    try {
      const res = await fetch("/api/moderador/proximo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao buscar a fila.");
      setDoc(body.doc);
      setPending(body.pending ?? 0);
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Erro ao buscar a fila.");
      setDoc(null);
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  const loadOperators = useCallback(async () => {
    setLoadingOps(true);
    const { data: ops } = await supabase
      .from("viewer_users")
      .select("id, name, code")
      .eq("role", "operador")
      .eq("active", true)
      .order("name", { ascending: true });

    const rows: OperatorRow[] = [];
    for (const op of ops || []) {
      const { count: inHands } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", op.id)
        .eq("status", "available");
      const { count: downloaded } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", op.id)
        .eq("status", "downloaded");
      rows.push({ ...op, in_hands: inHands || 0, downloaded: downloaded || 0 });
    }
    setOperators(rows);

    const { count: stockCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "available")
      .is("assigned_to", null);
    setStock(stockCount || 0);
    setLoadingOps(false);
  }, []);

  useEffect(() => {
    const s = getViewerSession();
    if (!s) {
      router.push("/");
      return;
    }
    if (s.role !== "moderador") {
      router.push(homeForRole(s.role));
      return;
    }
    setSession(s);
    loadNext(s.id);
  }, [router, loadNext]);

  useEffect(() => {
    if (tab === "distribuir") loadOperators();
  }, [tab, loadOperators]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleLogout() {
    clearViewerSession();
    router.push("/");
  }

  function handleDone(outcome: "approved" | "rejected") {
    setDoneCount((c) => ({ ...c, [outcome]: c[outcome] + 1 }));
    setToast(
      outcome === "approved"
        ? { type: "success", text: "Documento aprovado e salvo." }
        : { type: "danger", text: "Documento recusado." }
    );
    if (session) loadNext(session.id);
  }

  async function handleAssign(operatorId: string) {
    const amount = parseInt(assignAmount, 10);
    if (!session || !amount || amount < 1) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      const res = await fetch("/api/moderador/atribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId: session.id, operatorId, amount }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao distribuir.");
      const op = operators.find((o) => o.id === operatorId);
      setAssignMsg({ type: "success", text: `${body.assigned} documento(s) enviado(s) para ${op?.name || "o operador"}.` });
      setAssignTarget(null);
      setAssignAmount("");
      loadOperators();
    } catch (err) {
      setAssignMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao distribuir." });
    } finally {
      setAssigning(false);
    }
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden noise">
      <div className="absolute inset-0 grid-bg" />

      <header className="relative z-10 w-full max-w-3xl flex items-center justify-between px-6 py-6 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-primary">R</span>
            <span className="text-text-primary">IKO</span>
          </span>
          <span className="badge badge-primary text-[9px] uppercase tracking-widest">Moderador</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-tertiary text-xs hidden sm:inline">{session.name}</span>
          <button onClick={handleLogout} className="btn-ghost text-xs">
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 w-full max-w-3xl px-6">
        <div className="inline-flex rounded-md border border-surface-border bg-surface-0 p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab("revisar")}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === "revisar" ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Revisar
            {pending > 0 && (
              <span className="ml-2 font-mono text-[10px] text-text-secondary">{pending}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("distribuir")}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === "distribuir" ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Distribuir
          </button>
          <button
            type="button"
            onClick={() => setTab("sites")}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === "sites" ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Sites
          </button>
          <button
            type="button"
            onClick={() => setTab("ferramentas")}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === "ferramentas" ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            Ferramentas
          </button>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-6 py-6 pb-10">
        {toast && (
          <div
            className={`mb-4 rounded-md border px-4 py-2 text-xs font-medium animate-fade-in ${
              toast.type === "success"
                ? "border-success/40 bg-success/10 text-success"
                : "border-danger/40 bg-danger-muted text-danger"
            }`}
          >
            {toast.text}
          </div>
        )}

        {tab === "ferramentas" ? (
          <FerramentasPanel viewerId={session.id} />
        ) : tab === "sites" ? (
          <SitesPanel viewerId={session.id} canEdit />
        ) : tab === "revisar" ? (
          <>
            <div className="w-full max-w-xl flex items-center justify-between text-[11px] text-text-tertiary font-mono mb-3">
              <span>{pending} na fila</span>
              <span>
                Nesta sessão: <span className="text-success">{doneCount.approved} aprovados</span> ·{" "}
                <span className="text-danger">{doneCount.rejected} recusados</span>
              </span>
            </div>

            {loadingDoc ? (
              <p className="text-text-tertiary text-sm mt-10">Carregando...</p>
            ) : queueError ? (
              <div className="glass-static rounded-lg p-8 text-center max-w-sm">
                <p className="text-danger font-medium mb-3">{queueError}</p>
                <button onClick={() => loadNext(session.id)} className="btn-ghost text-xs">
                  Tentar de novo
                </button>
              </div>
            ) : !doc ? (
              <div className="glass-static rounded-lg p-8 text-center max-w-sm mt-10">
                <p className="text-text-primary font-medium mb-1">Fila vazia</p>
                <p className="text-text-tertiary text-sm mb-4">Nenhum documento aguardando moderação.</p>
                <button onClick={() => loadNext(session.id)} className="btn-ghost text-xs">
                  Atualizar
                </button>
              </div>
            ) : (
              <DocumentCard doc={doc} viewerId={session.id} viewerName={session.name} onDone={handleDone} />
            )}
          </>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-4 animate-fade-in">
            <div className="glass-static rounded-lg p-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                  Estoque aprovado
                </h2>
                <p className="text-text-tertiary text-xs mt-0.5">Documentos revisados, prontos pra enviar aos operadores</p>
              </div>
              <span className="text-3xl font-bold text-primary font-mono">{loadingOps ? "…" : stock}</span>
            </div>

            {assignMsg && (
              <p className={`text-xs font-medium ${assignMsg.type === "success" ? "text-success" : "text-danger"}`}>
                {assignMsg.text}
              </p>
            )}

            <div className="glass-static rounded-lg overflow-hidden">
              {loadingOps && operators.length === 0 ? (
                <p className="text-text-tertiary text-sm p-6">Carregando operadores...</p>
              ) : operators.length === 0 ? (
                <p className="text-text-tertiary text-sm p-6">Nenhum operador ativo. Peça ao admin pra criar em Usuários.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-tertiary text-xs uppercase tracking-wider border-b border-surface-border">
                      <th className="p-4">Operador</th>
                      <th className="p-4">Em mãos</th>
                      <th className="p-4">Baixados</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((op) => (
                      <tr key={op.id} className="border-b border-surface-border last:border-0">
                        <td className="p-4 text-text-primary">{op.name}</td>
                        <td className="p-4 text-text-secondary font-mono">{op.in_hands}</td>
                        <td className="p-4 text-text-tertiary font-mono">{op.downloaded}</td>
                        <td className="p-4">
                          {assignTarget === op.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <input
                                type="number"
                                min={1}
                                max={stock}
                                value={assignAmount}
                                onChange={(e) => setAssignAmount(e.target.value)}
                                className="input-base w-20 mono-input text-center"
                                placeholder="qtd"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAssign(op.id);
                                  if (e.key === "Escape") setAssignTarget(null);
                                }}
                              />
                              <button
                                onClick={() => handleAssign(op.id)}
                                disabled={assigning || !assignAmount || parseInt(assignAmount, 10) < 1}
                                className="btn-primary text-xs px-3 py-1.5"
                              >
                                {assigning ? "Enviando..." : "Enviar"}
                              </button>
                              <button onClick={() => setAssignTarget(null)} className="btn-ghost text-xs px-3 py-1.5">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  setAssignTarget(op.id);
                                  setAssignMsg(null);
                                }}
                                disabled={stock === 0}
                                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
                              >
                                Distribuir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
