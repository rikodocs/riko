"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBRL } from "@/lib/money";
import { equipeCall, fmtData, type ResumoOperador } from "./api";

function Stat({ label, valor, cor = "text-text-primary", sub }: { label: string; valor: string; cor?: string; sub?: string }) {
  return (
    <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1 text-lg font-bold ${cor}`}>{valor}</p>
      {sub && <p className="text-[10px] text-text-disabled">{sub}</p>}
    </div>
  );
}

/** Financeiro do operador: o que gerou (contas × taxa), o que já recebeu e o que falta. */
export function FinanceiroOperador({ viewerId, refreshKey = 0 }: { viewerId: string; refreshKey?: number }) {
  const [eu, setEu] = useState<ResumoOperador | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const b = await equipeCall<{ eu: ResumoOperador }>("financeiro", viewerId, { action: "resumo" });
      setEu(b.eu);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar, refreshKey]);

  if (erro) return <p className="text-xs text-danger">{erro}</p>;
  if (!eu) return <p className="text-xs text-text-tertiary">Carregando...</p>;

  const aReceber = Math.max(0, eu.a_receber_centavos);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Contas subidas" valor={String(eu.contas)} />
        <Stat label="Gerou" valor={formatBRL(eu.gerado_centavos)} cor="text-primary" sub="contas × taxa" />
        <Stat label="Já recebi" valor={formatBRL(eu.pago_centavos)} cor="text-success" />
        <Stat label="A receber" valor={formatBRL(aReceber)} cor={aReceber > 0 ? "text-danger" : "text-text-primary"} />
      </div>

      <div className="rounded-md border border-surface-border bg-surface-1">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary border-b border-surface-border">Por produto</p>
        {eu.por_produto.length === 0 ? (
          <p className="px-3 py-3 text-xs text-text-tertiary">Nenhuma conta ainda.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium">Taxa atual</th>
                <th className="px-3 py-2 font-medium">Contas</th>
                <th className="px-3 py-2 font-medium">Gerou</th>
              </tr>
            </thead>
            <tbody>
              {eu.por_produto.map((p) => (
                <tr key={p.produto_id} className="border-t border-surface-border">
                  <td className="px-3 py-1.5 text-text-primary">{p.titulo}</td>
                  <td className="px-3 py-1.5 text-text-tertiary">{formatBRL(p.taxa_centavos)}/conta</td>
                  <td className="px-3 py-1.5 font-mono text-text-secondary">{p.contas}</td>
                  <td className="px-3 py-1.5 text-text-primary">{formatBRL(p.gerado_centavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-md border border-surface-border bg-surface-1">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary border-b border-surface-border">Pagamentos recebidos</p>
        {eu.pagamentos.length === 0 ? (
          <p className="px-3 py-3 text-xs text-text-tertiary">Nenhum pagamento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {eu.pagamentos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="text-text-tertiary">
                  {fmtData(p.created_at)}
                  {p.obs && <span className="ml-2 text-text-secondary">— {p.obs}</span>}
                </span>
                <span className="font-semibold text-success">{formatBRL(p.valor_centavos)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
