"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBRL, parsePrecoToCents } from "@/lib/money";
import { equipeCall, fmtData, type Produto, type ResumoOperador } from "./api";

function Stat({ label, valor, cor = "text-text-primary", sub }: { label: string; valor: string; cor?: string; sub?: string }) {
  return (
    <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1 text-base font-bold ${cor}`}>{valor}</p>
      {sub && <p className="text-[10px] text-text-disabled">{sub}</p>}
    </div>
  );
}

function reais(c: number) {
  return (c / 100).toFixed(2).replace(".", ",");
}

/** Financeiro da equipe (moderador): taxa R$/conta por operador × produto, pagamentos, saldo. */
export function FinanceiroEquipe({ viewerId }: { viewerId: string }) {
  const [ops, setOps] = useState<ResumoOperador[] | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [taxaVals, setTaxaVals] = useState<Record<string, string>>({});
  const [pagar, setPagar] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; erro: boolean } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const b = await equipeCall<{ operadores: ResumoOperador[]; produtos: Produto[] }>("financeiro", viewerId, { action: "resumo" });
      setOps(b.operadores);
      setProdutos(b.produtos.filter((p) => p.ativo));
      const vals: Record<string, string> = {};
      for (const op of b.operadores) for (const pp of op.por_produto) vals[`${op.operador_id}:${pp.produto_id}`] = reais(pp.taxa_centavos);
      setTaxaVals((prev) => ({ ...vals, ...Object.fromEntries(Object.entries(prev).filter(([k]) => !(k in vals))) }));
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  async function salvarTaxa(opId: string, prodId: string) {
    const chave = `${opId}:${prodId}`;
    const centavos = parsePrecoToCents(taxaVals[chave] ?? "");
    if (centavos === null) return setMsg({ id: chave, text: "Valor inválido.", erro: true });
    setBusy(chave);
    setMsg(null);
    try {
      await equipeCall("financeiro", viewerId, { action: "taxa", operadorId: opId, produtoId: prodId, centavos });
      setMsg({ id: chave, text: "Taxa salva.", erro: false });
      await carregar();
    } catch (err) {
      setMsg({ id: chave, text: err instanceof Error ? err.message : "Erro.", erro: true });
    } finally {
      setBusy(null);
    }
  }

  async function registrarPagamento(opId: string) {
    const centavos = parsePrecoToCents(pagar[opId] ?? "");
    if (centavos === null || centavos <= 0) return setMsg({ id: opId, text: "Informe um valor pago.", erro: true });
    setBusy(`${opId}:pg`);
    setMsg(null);
    try {
      await equipeCall("financeiro", viewerId, { action: "pagar", operadorId: opId, centavos, obs: obs[opId] ?? "" });
      setPagar((p) => ({ ...p, [opId]: "" }));
      setObs((p) => ({ ...p, [opId]: "" }));
      setMsg({ id: opId, text: "Pagamento registrado.", erro: false });
      await carregar();
    } catch (err) {
      setMsg({ id: opId, text: err instanceof Error ? err.message : "Erro.", erro: true });
    } finally {
      setBusy(null);
    }
  }

  async function estornar(opId: string, pagamentoId: string) {
    if (!window.confirm("Estornar este pagamento?")) return;
    setBusy(pagamentoId);
    try {
      await equipeCall("financeiro", viewerId, { action: "estornar", pagamentoId });
      setMsg({ id: opId, text: "Pagamento estornado.", erro: false });
      await carregar();
    } catch (err) {
      setMsg({ id: opId, text: err instanceof Error ? err.message : "Erro.", erro: true });
    } finally {
      setBusy(null);
    }
  }

  if (erro) return <p className="text-xs text-danger">{erro}</p>;
  if (ops === null) return <p className="text-xs text-text-tertiary">Carregando...</p>;

  const totalContas = ops.reduce((a, o) => a + o.contas, 0);
  const totalPago = ops.reduce((a, o) => a + o.pago_centavos, 0);
  const totalAPagar = ops.reduce((a, o) => a + Math.max(0, o.a_receber_centavos), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Operadores" valor={String(ops.length)} />
        <Stat label="Contas da equipe" valor={String(totalContas)} cor="text-primary" />
        <Stat label="Já pago" valor={formatBRL(totalPago)} cor="text-success" />
        <Stat label="Falta pagar" valor={formatBRL(totalAPagar)} cor={totalAPagar > 0 ? "text-danger" : "text-text-primary"} />
      </div>

      {ops.length === 0 && (
        <p className="text-xs text-text-tertiary">Nenhum operador na sua equipe. O admin liga operadores a você em Usuários.</p>
      )}

      {ops.map((op) => {
        const expandido = aberto === op.operador_id;
        const saldo = Math.max(0, op.a_receber_centavos);
        return (
          <div key={op.operador_id} className="rounded-md border border-surface-border bg-surface-1 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{op.nome}</p>
                <p className="text-xs text-text-tertiary">
                  {op.contas} contas subidas · {op.novas} aguardando download
                </p>
              </div>
              <span className={`badge ${saldo > 0 ? "badge-danger" : "badge-success"}`}>{saldo > 0 ? `Falta ${formatBRL(saldo)}` : "Em dia"}</span>
            </div>

            <div className="grid gap-2 grid-cols-3">
              <Stat label="Gerou" valor={formatBRL(op.gerado_centavos)} cor="text-primary" sub="contas × taxa" />
              <Stat label="Já paguei" valor={formatBRL(op.pago_centavos)} cor="text-success" />
              <Stat label="Tenho que pagar" valor={formatBRL(saldo)} cor={saldo > 0 ? "text-danger" : "text-text-primary"} />
            </div>

            {msg && msg.id === op.operador_id && <p className={`text-xs ${msg.erro ? "text-danger" : "text-success"}`}>{msg.text}</p>}

            <div className="grid gap-3 lg:grid-cols-2">
              {/* Taxas */}
              <div className="rounded-md border border-surface-border p-3 space-y-2">
                <button type="button" onClick={() => setAberto(expandido ? null : op.operador_id)} className="text-xs font-semibold text-text-primary">
                  Taxa R$/conta por produto {expandido ? "▾" : "▸"}
                </button>
                {expandido && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-text-disabled">
                      Mudar a taxa vale pras próximas contas. As que já subiram ficam com o valor da época (só as que ficaram em R$ 0,00 por falta de taxa recebem a nova).
                    </p>
                    {produtos.length === 0 && <p className="text-xs text-text-tertiary">Cadastre produtos na aba Produtos.</p>}
                    {produtos.map((p) => {
                      const chave = `${op.operador_id}:${p.id}`;
                      const pp = op.por_produto.find((x) => x.produto_id === p.id);
                      return (
                        <div key={p.id} className="grid gap-2 grid-cols-[minmax(0,1fr)_100px_auto] items-center">
                          <span className="text-xs text-text-primary truncate">
                            {p.titulo}
                            {pp && <span className="ml-1 text-text-disabled">({pp.contas})</span>}
                          </span>
                          <label className="flex items-center input-base !py-1 !px-2">
                            <span className="text-xs text-text-tertiary mr-1">R$</span>
                            <input value={taxaVals[chave] ?? ""} onChange={(e) => setTaxaVals((v) => ({ ...v, [chave]: e.target.value }))} inputMode="decimal" placeholder="0,00" className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                          </label>
                          <button type="button" disabled={busy === chave} onClick={() => salvarTaxa(op.operador_id, p.id)} className="btn-ghost text-xs px-2 py-1">
                            {busy === chave ? "..." : "Salvar"}
                          </button>
                          {msg && msg.id === chave && <p className={`col-span-3 text-[11px] ${msg.erro ? "text-danger" : "text-success"}`}>{msg.text}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagamento */}
              <div className="rounded-md border border-surface-border p-3 space-y-2">
                <p className="text-xs font-semibold text-text-primary">Registrar pagamento</p>
                <div className="grid gap-2">
                  <label className="flex items-center input-base !py-1.5 !px-2">
                    <span className="text-xs text-text-tertiary mr-1">R$</span>
                    <input value={pagar[op.operador_id] ?? ""} onChange={(e) => setPagar((v) => ({ ...v, [op.operador_id]: e.target.value }))} inputMode="decimal" placeholder="0,00" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  </label>
                  <input value={obs[op.operador_id] ?? ""} onChange={(e) => setObs((v) => ({ ...v, [op.operador_id]: e.target.value }))} placeholder="Observação (opcional)" className="input-base !py-1.5 text-xs" />
                  <button type="button" disabled={busy === `${op.operador_id}:pg`} onClick={() => registrarPagamento(op.operador_id)} className="btn-primary !py-1.5 !text-xs">
                    {busy === `${op.operador_id}:pg` ? "Registrando..." : "Registrar"}
                  </button>
                </div>
                {op.pagamentos.length > 0 && (
                  <ul className="divide-y divide-surface-border border-t border-surface-border pt-1">
                    {op.pagamentos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                        <span className="text-text-tertiary truncate">
                          {fmtData(p.created_at)}
                          {p.obs && <span className="ml-1 text-text-secondary">— {p.obs}</span>}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-success">{formatBRL(p.valor_centavos)}</span>
                          <button type="button" disabled={busy === p.id} onClick={() => estornar(op.operador_id, p.id)} className="text-text-disabled hover:text-danger" title="Estornar">
                            ×
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
