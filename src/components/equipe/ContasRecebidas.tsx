"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { equipeCall, baixarBase64, stamp, fmtData, type ContaLista } from "./api";

type Filtro = "novas" | "baixadas" | "todas";

/** Contas que os operadores subiram. O moderador baixa o .xlsx (AdsPower) pra subir na Mikey Ads. */
export function ContasRecebidas({ viewerId }: { viewerId: string }) {
  const [contas, setContas] = useState<ContaLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("novas");
  const [busca, setBusca] = useState("");
  const [produtoSel, setProdutoSel] = useState("");
  const [operadorSel, setOperadorSel] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
  }, [carregar]);

  const produtos = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of contas || []) m.set(c.produto_id, c.produto || "—");
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [contas]);
  const operadores = useMemo(() => [...new Set((contas || []).map((c) => c.operador || "—"))].sort(), [contas]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (contas || []).filter((c) => {
      if (filtro === "novas" && c.status !== "nova") return false;
      if (filtro === "baixadas" && c.status !== "baixada") return false;
      if (produtoSel && c.produto_id !== produtoSel) return false;
      if (operadorSel && (c.operador || "—") !== operadorSel) return false;
      if (!termo) return true;
      return (c.login || "").toLowerCase().includes(termo) || c.source_key.toLowerCase().includes(termo) || (c.cnpj || "").includes(termo);
    });
  }, [contas, filtro, produtoSel, operadorSel, busca]);

  const novasTotal = contas?.filter((c) => c.status === "nova").length ?? 0;

  // Resumo novas por operador × produto (o que tem pra baixar)
  const resumo = useMemo(() => {
    const m = new Map<string, { operador: string; produto: string; produto_id: string; n: number }>();
    for (const c of contas || []) {
      if (c.status !== "nova") continue;
      const k = `${c.operador}|${c.produto_id}`;
      const e = m.get(k) ?? { operador: c.operador || "—", produto: c.produto || "—", produto_id: c.produto_id, n: 0 };
      e.n += 1;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => a.operador.localeCompare(b.operador) || a.produto.localeCompare(b.produto));
  }, [contas]);

  async function baixar(ids: string[], rotulo: string, marcar: boolean) {
    if (ids.length === 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const b = await equipeCall<{ xlsx: string; count: number }>("contas", viewerId, { action: "baixar", ids, apenasNovas: false, marcar });
      baixarBase64(b.xlsx, `${b.count}contas-${rotulo}-${stamp()}.xlsx`);
      setMsg({ type: "success", text: `${b.count} conta(s) baixada(s)${marcar ? " e marcadas como baixadas" : ""}.` });
      setSelecionadas(new Set());
      await carregar();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao baixar." });
    } finally {
      setBusy(false);
    }
  }

  function slug(s: string) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "contas";
  }

  if (erro) return <p className="text-xs text-danger">{erro}</p>;
  if (contas === null) return <p className="text-xs text-text-tertiary">Carregando...</p>;

  const todasVisiveisSel = visiveis.length > 0 && visiveis.every((c) => selecionadas.has(c.id));

  return (
    <div className="space-y-4">
      {/* O que tem pra baixar, por operador × produto */}
      <div className="rounded-md border border-surface-border bg-surface-1">
        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Novas pra baixar ({novasTotal})</p>
          {novasTotal > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => baixar(contas.filter((c) => c.status === "nova").map((c) => c.id), "todas", true)}
              className="btn-primary !py-1.5 !px-3 !text-xs"
            >
              Baixar todas as novas
            </button>
          )}
        </div>
        {resumo.length === 0 ? (
          <p className="px-3 py-3 text-xs text-text-tertiary">Nenhuma conta nova. Quando um operador subir, aparece aqui.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Operador</th>
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium">Novas</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((r) => (
                <tr key={`${r.operador}|${r.produto_id}`} className="border-t border-surface-border">
                  <td className="px-3 py-1.5 text-text-primary">{r.operador}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{r.produto}</td>
                  <td className="px-3 py-1.5 font-mono text-text-secondary">{r.n}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        baixar(
                          contas.filter((c) => c.status === "nova" && (c.operador || "—") === r.operador && c.produto_id === r.produto_id).map((c) => c.id),
                          `${slug(r.operador)}-${slug(r.produto)}`,
                          true
                        )
                      }
                      className="btn-ghost text-xs px-2.5 py-1"
                    >
                      Baixar .xlsx
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {msg && <p className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</p>}

      {/* Lista completa com filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1">
          {(
            [
              ["novas", "Novas"],
              ["baixadas", "Baixadas"],
              ["todas", "Todas"],
            ] as [Filtro, string][]
          ).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFiltro(v)} className={`px-3 py-1.5 rounded text-xs font-medium ${filtro === v ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"}`}>
              {l}
            </button>
          ))}
        </div>
        <select value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)} className="input-base !py-1.5 text-xs">
          <option value="">Todos os produtos</option>
          {produtos.map(([id, t]) => (
            <option key={id} value={id}>
              {t}
            </option>
          ))}
        </select>
        <select value={operadorSel} onChange={(e) => setOperadorSel(e.target.value)} className="input-base !py-1.5 text-xs">
          <option value="">Todos os operadores</option>
          {operadores.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Login, identificador ou CNPJ" className="input-base !py-1.5 text-xs flex-1 min-w-[160px]" />
        <span className="text-[11px] text-text-disabled font-mono">{visiveis.length}</span>
      </div>

      {selecionadas.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary-muted px-3 py-2 text-xs">
          <span className="text-primary font-medium">{selecionadas.size} selecionada(s)</span>
          <button type="button" disabled={busy} onClick={() => baixar([...selecionadas], "selecionadas", true)} className="btn-primary !py-1 !px-3 !text-xs">
            Baixar e marcar
          </button>
          <button type="button" disabled={busy} onClick={() => baixar([...selecionadas], "selecionadas", false)} className="btn-ghost !py-1 !px-3 !text-xs">
            Só baixar (sem marcar)
          </button>
          <button type="button" onClick={() => setSelecionadas(new Set())} className="btn-ghost !py-1 !px-3 !text-xs ml-auto">
            Limpar
          </button>
        </div>
      )}

      <div className="rounded-md border border-surface-border bg-surface-1 max-h-[480px] overflow-auto">
        {visiveis.length === 0 ? (
          <p className="px-3 py-3 text-xs text-text-tertiary">Nada com esse filtro.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-0 text-text-tertiary">
              <tr className="text-left">
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={todasVisiveisSel}
                    onChange={(e) => {
                      const n = new Set(selecionadas);
                      for (const c of visiveis) {
                        if (e.target.checked) n.add(c.id);
                        else n.delete(c.id);
                      }
                      setSelecionadas(n);
                    }}
                  />
                </th>
                <th className="px-3 py-2 font-medium">Login</th>
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium">Operador</th>
                <th className="px-3 py-2 font-medium">Subida em</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((c) => (
                <tr key={c.id} className="border-t border-surface-border">
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={selecionadas.has(c.id)}
                      onChange={(e) => {
                        const n = new Set(selecionadas);
                        if (e.target.checked) n.add(c.id);
                        else n.delete(c.id);
                        setSelecionadas(n);
                      }}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-text-primary">
                    {c.login || "—"}
                    <span className="block font-mono text-[10px] text-text-disabled">{c.source_key}</span>
                  </td>
                  <td className="px-3 py-1.5 text-text-secondary">{c.produto}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{c.operador}</td>
                  <td className="px-3 py-1.5 text-text-tertiary">{fmtData(c.created_at)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`badge ${c.status === "baixada" ? "badge-success" : "badge-warning"}`} title={c.baixada_em ? `Baixada em ${fmtData(c.baixada_em)}` : undefined}>
                      {c.status === "baixada" ? "Baixada" : "Nova"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
