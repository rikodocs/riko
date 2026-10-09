"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { equipeCall, fmtData, type ContaLista } from "./api";

/** Meus envios (operador): total por produto e, abrindo, quais contas com data e status. */
export function MeusEnvios({ viewerId, refreshKey = 0 }: { viewerId: string; refreshKey?: number }) {
  const [contas, setContas] = useState<ContaLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const carregar = useCallback(async () => {
    try {
      const b = await equipeCall<{ contas: ContaLista[] }>("contas", viewerId, { action: "list" });
      setContas(b.contas);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar, refreshKey]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = (contas || []).filter(
      (c) => !termo || (c.produto || "").toLowerCase().includes(termo) || (c.login || "").toLowerCase().includes(termo) || c.source_key.toLowerCase().includes(termo)
    );
    const map = new Map<string, { titulo: string; contas: ContaLista[] }>();
    for (const c of filtradas) {
      const g = map.get(c.produto_id) ?? { titulo: c.produto || "—", contas: [] };
      g.contas.push(c);
      map.set(c.produto_id, g);
    }
    return [...map.entries()].sort((a, b) => a[1].titulo.localeCompare(b[1].titulo));
  }, [contas, busca]);

  const total = contas?.length ?? 0;
  const novas = contas?.filter((c) => c.status === "nova").length ?? 0;

  if (erro) return <p className="text-xs text-danger">{erro}</p>;
  if (contas === null) return <p className="text-xs text-text-tertiary">Carregando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por produto, login ou identificador..." className="input-base flex-1" />
        <span className="text-[11px] text-text-disabled font-mono">
          {total} contas · {novas} aguardando o moderador
        </span>
      </div>

      {grupos.length === 0 ? (
        <p className="text-xs text-text-tertiary">{total === 0 ? "Você ainda não subiu nenhuma conta." : "Nada encontrado."}</p>
      ) : (
        grupos.map(([pid, g]) => {
          const aberto = abertos.has(pid);
          return (
            <div key={pid} className="rounded-md border border-surface-border bg-surface-1">
              <button
                type="button"
                onClick={() =>
                  setAbertos((s) => {
                    const n = new Set(s);
                    if (n.has(pid)) n.delete(pid);
                    else n.add(pid);
                    return n;
                  })
                }
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span className="text-sm font-semibold text-text-primary">{g.titulo}</span>
                <span className="text-xs text-text-tertiary font-mono">
                  {g.contas.length} · {g.contas.filter((c) => c.status === "nova").length} novas {aberto ? "▾" : "▸"}
                </span>
              </button>
              {aberto && (
                <div className="border-t border-surface-border max-h-72 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="text-text-tertiary">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Login</th>
                        <th className="px-3 py-2 font-medium">Identificador</th>
                        <th className="px-3 py-2 font-medium">Subida em</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.contas.map((c) => (
                        <tr key={c.id} className="border-t border-surface-border">
                          <td className="px-3 py-1.5 text-text-primary">{c.login || "—"}</td>
                          <td className="px-3 py-1.5 font-mono text-text-tertiary">{c.source_key}</td>
                          <td className="px-3 py-1.5 text-text-tertiary">{fmtData(c.created_at)}</td>
                          <td className="px-3 py-1.5">
                            <span className={`badge ${c.status === "baixada" ? "badge-success" : "badge-warning"}`}>
                              {c.status === "baixada" ? "Baixada pelo moderador" : "Aguardando"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
