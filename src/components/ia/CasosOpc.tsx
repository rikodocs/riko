"use client";

import { useEffect, useState, useCallback } from "react";
import { FiChevronDown, FiChevronRight, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { RespostasOpcPainel } from "@/components/ia/RespostasOpcPainel";
import { formatCnpj } from "@/lib/cnpj/brasilapi";
import type { RespostasOpc } from "@/lib/ia/gerar-index";

export type StatusCaso = "draft" | "submitted" | "em_analise" | "aprovado" | "rejeitado";

export type CasoOpc = {
  id: string;
  empresa: string | null;
  cnpj: string | null;
  dominio: string | null;
  status: StatusCaso;
  motivo_recusa: string | null;
  respostas: RespostasOpc | null;
  created_at: string;
  autor: { name: string } | null;
};

const CORES: Record<StatusCaso, string> = {
  draft: "badge-warning",
  submitted: "badge-primary",
  em_analise: "badge-primary",
  aprovado: "badge-success",
  rejeitado: "badge-danger",
};

const ROTULOS: Record<StatusCaso, string> = {
  draft: "rascunho",
  submitted: "enviado",
  em_analise: "em análise",
  aprovado: "aprovado",
  rejeitado: "rejeitado",
};

function Caso({ caso, onMudou, call }: { caso: CasoOpc; onMudou: () => void; call: (p: Record<string, unknown>) => Promise<unknown> }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(caso.motivo_recusa ?? "");
  const [busy, setBusy] = useState(false);

  async function marcar(status: StatusCaso) {
    setBusy(true);
    try {
      await call({ action: "update", id: caso.id, status, motivo });
    } finally {
      setBusy(false);
      onMudou();
    }
  }

  async function excluir() {
    if (!window.confirm("Excluir este caso?")) return;
    setBusy(true);
    try {
      await call({ action: "delete", id: caso.id });
    } finally {
      setBusy(false);
      onMudou();
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface-1">
      <div className="flex items-center gap-2 p-2.5">
        <button type="button" onClick={() => setAberto((v) => !v)} className="flex flex-1 items-center gap-2 text-left min-w-0" aria-expanded={aberto}>
          {aberto ? <FiChevronDown size={14} className="shrink-0 text-text-tertiary" /> : <FiChevronRight size={14} className="shrink-0 text-text-tertiary" />}
          <span className="flex-1 truncate text-xs font-semibold text-text-primary">
            {caso.empresa ?? "(sem nome)"}
            {caso.cnpj && <span className="ml-2 font-normal font-mono text-text-tertiary">{formatCnpj(caso.cnpj)}</span>}
          </span>
        </button>
        {caso.autor?.name && <span className="hidden sm:inline text-[10px] text-text-disabled">{caso.autor.name}</span>}
        <span className={`badge ${CORES[caso.status]}`}>{ROTULOS[caso.status]}</span>
        <span className="hidden text-[10px] text-text-disabled sm:inline">{new Date(caso.created_at).toLocaleDateString("pt-BR")}</span>
      </div>

      {aberto && (
        <div className="space-y-3 border-t border-surface-border p-3">
          {caso.dominio && (
            <p className="text-xs text-text-tertiary">
              Site associado: <span className="text-primary">{caso.dominio}</span>
            </p>
          )}

          {caso.respostas ? <RespostasOpcPainel respostas={caso.respostas} /> : <p className="text-xs text-text-tertiary">Esse caso não tem respostas salvas.</p>}

          <div className="space-y-2 rounded-md border border-surface-border p-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Motivo da recusa (cole o texto do Google)</span>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Ex.: não há informações suficientes sobre suas operações comerciais…"
                className="input-base w-full text-xs resize-y"
              />
              <span className="text-[10px] text-text-disabled">É o campo mais valioso: é ele que diz qual variável reprovou.</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={busy} onClick={() => marcar("aprovado")} className="rounded bg-success-muted px-2.5 py-1 text-xs font-semibold text-success disabled:opacity-40">
                Aprovou
              </button>
              <button type="button" disabled={busy} onClick={() => marcar("rejeitado")} className="rounded bg-danger-muted px-2.5 py-1 text-xs font-semibold text-danger disabled:opacity-40">
                Recusou
              </button>
              <button type="button" disabled={busy} onClick={() => marcar("em_analise")} className="btn-ghost text-xs px-2.5 py-1">
                Em análise
              </button>
              <button type="button" disabled={busy} onClick={excluir} title="Excluir caso" aria-label="Excluir caso" className="ml-auto rounded p-1.5 text-text-tertiary hover:text-danger disabled:opacity-40">
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Casos de OPC salvos: as respostas usadas + o resultado (pra virar referência). Trazido da Mikey Ads. */
export function CasosOpc({ viewerId }: { viewerId: string }) {
  const [casos, setCasos] = useState<CasoOpc[] | null>(null);
  const [soAprovados, setSoAprovados] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const r = await fetch("/api/ferramentas/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId, ...payload }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Erro na requisição.");
      return body;
    },
    [viewerId]
  );

  const carregar = useCallback(
    async (filtro: boolean) => {
      try {
        const body = (await call({ action: "list", apenasAprovados: filtro })) as { casos: CasoOpc[] };
        setCasos(body.casos);
        setErro(null);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar.");
      }
    },
    [call]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar(soAprovados);
  }, [carregar, soAprovados]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-xs text-text-tertiary">
          As respostas que já foram usadas, com o resultado. Marque <strong className="text-text-secondary">aprovou/recusou</strong> — inclusive as recusas com o motivo, que é o que revela qual variável pesa.
        </p>
        <label className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <input type="checkbox" checked={soAprovados} onChange={(e) => setSoAprovados(e.target.checked)} />
          Só aprovados
        </label>
        <button type="button" onClick={() => carregar(soAprovados)} title="Recarregar" aria-label="Recarregar casos" className="rounded p-1.5 text-text-tertiary hover:text-primary">
          <FiRefreshCw size={14} />
        </button>
      </div>

      {erro && (
        <p className="text-xs text-danger font-medium" role="alert">
          {erro}
        </p>
      )}

      {casos === null && !erro && <p className="text-xs text-text-tertiary">Carregando…</p>}

      {casos?.length === 0 && (
        <p className="text-xs text-text-tertiary">{soAprovados ? "Nenhum caso aprovado ainda." : "Nenhum caso salvo ainda — gere um OPC em “Testar gerador”."}</p>
      )}

      <div className="space-y-2">{casos?.map((c) => <Caso key={c.id} caso={c} call={call} onMudou={() => carregar(soAprovados)} />)}</div>
    </div>
  );
}
