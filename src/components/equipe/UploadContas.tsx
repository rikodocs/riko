"use client";

import { useEffect, useState, useCallback } from "react";
import { equipeCall, type Produto } from "./api";

type Resumo = { source_key: string; login: string | null; motivo?: string };
type Resultado = { produto: string; total: number; adicionadas: Resumo[]; ignoradas: Resumo[]; semCookie: Resumo[] };

function Tabela({ contas }: { contas: Resumo[] }) {
  const comMotivo = contas.some((c) => c.motivo);
  return (
    <div className="max-h-56 overflow-auto rounded-md border border-surface-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface-0 text-text-tertiary">
          <tr>
            <th className="px-3 py-2 font-medium">Identificador</th>
            <th className="px-3 py-2 font-medium">Login</th>
            {comMotivo && <th className="px-3 py-2 font-medium">Motivo</th>}
          </tr>
        </thead>
        <tbody>
          {contas.map((c, i) => (
            <tr key={`${c.source_key}-${i}`} className="border-t border-surface-border">
              <td className="px-3 py-1.5 font-mono text-text-primary">{c.source_key || "—"}</td>
              <td className="px-3 py-1.5 text-text-tertiary">{c.login || "—"}</td>
              {comMotivo && <td className="px-3 py-1.5 text-warning">{c.motivo || "-"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Subir contas: mesma planilha .xlsx da Mikey Ads (export do AdsPower). */
export function UploadContas({ viewerId, onEnviou }: { viewerId: string; onEnviou?: () => void }) {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [res, setRes] = useState<Resultado | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const carregar = useCallback(async () => {
    try {
      const b = await equipeCall<{ produtos: Produto[] }>("produtos", viewerId, { action: "list" });
      setProdutos(b.produtos.filter((p) => p.ativo));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar produtos.");
      setProdutos([]);
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoId || !arquivo) return;
    setBusy(true);
    setErro(null);
    setRes(null);
    try {
      const fd = new FormData();
      fd.append("viewerId", viewerId);
      fd.append("produtoId", produtoId);
      fd.append("arquivo", arquivo);
      const r = await fetch("/api/equipe/contas/upload", { method: "POST", body: fd });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Erro ao subir.");
      setRes(body);
      setArquivo(null);
      setInputKey((k) => k + 1);
      onEnviou?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao subir.");
    } finally {
      setBusy(false);
    }
  }

  if (produtos === null) return <p className="text-text-tertiary text-xs">Carregando produtos...</p>;

  if (produtos.length === 0) {
    return (
      <p className="text-text-tertiary text-xs">
        {erro ?? "Nenhum produto ativo. O moderador precisa cadastrar os produtos na aba Equipe → Produtos."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Sobe o mesmo <strong className="text-text-secondary">.xlsx</strong> que você subia na Mikey Ads (export do AdsPower).
        Cada conta é identificada pela coluna <code className="font-mono">id</code> / <code className="font-mono">acc_id</code> /{" "}
        <code className="font-mono">username</code>; se já existir na equipe, é ignorada.
      </p>
      <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Produto</span>
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className="input-base w-full" required>
            <option value="" disabled>
              Selecione o produto
            </option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Arquivo .xlsx</span>
          <input
            key={inputKey}
            type="file"
            accept=".xlsx"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-text-tertiary file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-on-primary"
            required
          />
        </label>
        {erro && (
          <p className="sm:col-span-2 text-xs text-danger font-medium" role="alert">
            {erro}
          </p>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={busy || !produtoId || !arquivo} className="btn-primary">
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              "Subir contas"
            )}
          </button>
        </div>
      </form>

      {res && (
        <div className="space-y-3 rounded-md border border-surface-border bg-surface-0 p-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-3">
              <p className="text-lg font-bold text-text-primary">{res.total}</p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">No arquivo</p>
            </div>
            <div className="rounded-md border border-success/30 bg-success-muted px-3 py-3">
              <p className="text-lg font-bold text-success">{res.adicionadas.length}</p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Adicionadas</p>
            </div>
            <div className="rounded-md border border-warning/30 bg-warning-muted px-3 py-3">
              <p className="text-lg font-bold text-warning">{res.ignoradas.length}</p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Ignoradas</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            Produto: <span className="text-text-primary">{res.produto}</span>
          </p>
          {res.semCookie.length > 0 && (
            <p className="text-xs text-warning">
              {res.semCookie.length} conta(s) entraram <strong>sem cookie</strong> (o Excel tinha quebrado o cookie na origem).
            </p>
          )}
          {res.ignoradas.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-text-primary">Ignoradas — motivo de cada uma:</p>
              <Tabela contas={res.ignoradas} />
            </div>
          )}
          {res.adicionadas.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-text-primary">Ver as {res.adicionadas.length} adicionadas</summary>
              <div className="mt-2">
                <Tabela contas={res.adicionadas} />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
