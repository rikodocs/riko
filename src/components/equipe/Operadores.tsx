"use client";

import { useEffect, useState, useCallback } from "react";

type Operador = { id: string; name: string; code: string; active: boolean; created_at: string };

async function call<T = Record<string, unknown>>(viewerId: string, payload: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/equipe/operadores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ viewerId, ...payload }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || "Erro na requisição.");
  return body as T;
}

/** Operadores da equipe: o moderador cria, renomeia, ativa/desativa e troca o código de acesso. */
export function Operadores({ viewerId }: { viewerId: string }) {
  const [ops, setOps] = useState<Operador[] | null>(null);
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const b = await call<{ operadores: Operador[] }>(viewerId, { action: "list" });
      setOps(b.operadores);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao carregar." });
      setOps([]);
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  async function run(key: string, payload: Record<string, unknown>, ok: (b: Record<string, unknown>) => string) {
    setBusy(key);
    setMsg(null);
    try {
      const b = await call(viewerId, payload);
      setMsg({ type: "success", text: ok(b) });
      await carregar();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro." });
    } finally {
      setBusy(null);
    }
  }

  async function copiar(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiado(code);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      // sem clipboard: o código continua visível
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Seus operadores entram em <code className="font-mono">/</code> com o código de 6 dígitos. Tudo que eles subirem vem pra você. Desativar
        bloqueia o acesso na hora sem apagar o histórico; excluir só funciona pra quem ainda não tem contas, pagamentos nem documentos.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!novo.trim()) return;
          run("add", { action: "add", name: novo }, (b) => {
            const op = b.operador as Operador | undefined;
            return op ? `${op.name} criado — código ${op.code}` : "Operador criado.";
          }).then(() => setNovo(""));
        }}
        className="flex gap-3"
      >
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome do operador" className="input-base flex-1" />
        <button type="submit" disabled={busy !== null || !novo.trim()} className="btn-primary">
          {busy === "add" ? "Criando..." : "Criar operador"}
        </button>
      </form>
      {msg && <p className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</p>}

      {ops === null ? (
        <p className="text-xs text-text-tertiary">Carregando...</p>
      ) : ops.length === 0 ? (
        <p className="text-xs text-text-tertiary">Nenhum operador ainda. Crie o primeiro acima.</p>
      ) : (
        <div className="rounded-md border border-surface-border bg-surface-1 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op) => (
                <tr key={op.id} className="border-t border-surface-border">
                  <td className={`px-3 py-2 ${op.active ? "text-text-primary" : "text-text-disabled"}`}>{op.name}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => copiar(op.code)} title="Copiar código" className="font-mono text-text-secondary hover:text-primary">
                      {op.code} {copiado === op.code && <span className="text-success">✓</span>}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => run(op.id, { action: "update", id: op.id, active: !op.active }, () => (op.active ? `${op.name} desativado.` : `${op.name} reativado.`))}
                      className={`badge ${op.active ? "badge-success" : "badge-danger"}`}
                    >
                      {op.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        const n = window.prompt("Novo nome:", op.name);
                        if (n && n.trim() && n.trim() !== op.name) run(op.id, { action: "update", id: op.id, name: n }, () => "Nome atualizado.");
                      }}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        if (window.confirm(`Gerar um código novo pra ${op.name}? O código atual deixa de funcionar.`))
                          run(op.id, { action: "novo_codigo", id: op.id }, (b) => `Novo código de ${op.name}: ${b.code}`);
                      }}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      Novo código
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        if (window.confirm(`Excluir ${op.name}? Só dá se ele não tiver contas, pagamentos nem documentos.`))
                          run(op.id, { action: "delete", id: op.id }, () => `${op.name} excluído.`);
                      }}
                      className="btn-ghost text-xs px-2 py-1 hover:text-danger"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
