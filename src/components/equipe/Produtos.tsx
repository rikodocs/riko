"use client";

import { useEffect, useState, useCallback } from "react";
import { equipeCall, type Produto } from "./api";

/** Produtos (tipos de conta) do moderador. */
export function Produtos({ viewerId }: { viewerId: string }) {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const b = await equipeCall<{ produtos: Produto[] }>("produtos", viewerId, { action: "list" });
      setProdutos(b.produtos);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao carregar." });
      setProdutos([]);
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  async function run(key: string, payload: Record<string, unknown>, ok: string) {
    setBusy(key);
    setMsg(null);
    try {
      await equipeCall("produtos", viewerId, payload);
      setMsg({ type: "success", text: ok });
      await carregar();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Os tipos de conta que sua equipe sobe (ex.: &ldquo;Google Ads verificada&rdquo;, &ldquo;Conta antiga&rdquo;). O operador escolhe o produto ao subir
        a planilha e a taxa R$/conta é definida por operador e produto no Financeiro.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!novo.trim()) return;
          run("add", { action: "add", titulo: novo }, "Produto criado.").then(() => setNovo(""));
        }}
        className="flex gap-3"
      >
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome do produto" className="input-base flex-1" />
        <button type="submit" disabled={busy !== null || !novo.trim()} className="btn-primary">
          {busy === "add" ? "Criando..." : "Criar"}
        </button>
      </form>
      {msg && <p className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</p>}

      {produtos === null ? (
        <p className="text-xs text-text-tertiary">Carregando...</p>
      ) : produtos.length === 0 ? (
        <p className="text-xs text-text-tertiary">Nenhum produto ainda. Crie o primeiro acima.</p>
      ) : (
        <div className="rounded-md border border-surface-border bg-surface-1 divide-y divide-surface-border">
          {produtos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className={`flex-1 text-sm ${p.ativo ? "text-text-primary" : "text-text-disabled line-through"}`}>{p.titulo}</span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => run(p.id, { action: "update", id: p.id, ativo: !p.ativo }, p.ativo ? "Produto desativado." : "Produto reativado.")}
                className={`badge ${p.ativo ? "badge-success" : "badge-danger"}`}
              >
                {p.ativo ? "Ativo" : "Inativo"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  const t = window.prompt("Novo nome do produto:", p.titulo);
                  if (t && t.trim() && t.trim() !== p.titulo) run(p.id, { action: "update", id: p.id, titulo: t }, "Nome atualizado.");
                }}
                className="btn-ghost text-xs px-2 py-1"
              >
                Renomear
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  if (window.confirm(`Excluir "${p.titulo}"? Só dá se não tiver contas.`)) run(p.id, { action: "delete", id: p.id }, "Produto excluído.");
                }}
                className="btn-ghost text-xs px-2 py-1 hover:text-danger"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
