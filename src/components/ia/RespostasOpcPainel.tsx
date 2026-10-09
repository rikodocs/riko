"use client";

import { useState } from "react";
import { FiCopy, FiCheck, FiAlertTriangle } from "react-icons/fi";
import type { RespostasOpc } from "@/lib/ia/gerar-index";

type CampoProps = {
  rotulo: string;
  valor: string;
  /** Seleção do formulário (marcar a opção) em vez de texto pra colar. */
  selecao?: boolean;
  /** Aviso a mostrar quando o valor vier vazio (em vez do traço). */
  avisoSeVazio?: string;
};

/** Um campo do formulário: rótulo, valor e botão de copiar. */
function Campo({ rotulo, valor, selecao, avisoSeVazio }: CampoProps) {
  const [copiado, setCopiado] = useState(false);
  const vazio = !valor;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // clipboard bloqueado (http/permissão): o texto continua selecionável.
    }
  }

  const alerta = vazio && !!avisoSeVazio;
  return (
    <div
      className={`relative rounded-lg border bg-[var(--color-surface-1)] p-3 pr-10 ${
        alerta ? "border-[var(--color-danger)]/60" : "border-surface-border"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {rotulo}
        {selecao && (
          <span className="rounded bg-glass-hover px-1 py-px text-[9px] font-medium normal-case tracking-normal text-[var(--color-text-tertiary)]">
            marque a opção
          </span>
        )}
      </span>

      {alerta ? (
        <p className="mt-1 flex items-start gap-1.5 text-sm leading-snug text-[var(--color-danger)]">
          <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{avisoSeVazio}</span>
        </p>
      ) : (
        <p
          className={`mt-1 break-words text-sm leading-snug text-[var(--color-text-primary)] ${
            selecao ? "font-mono text-[var(--color-primary)]" : ""
          }`}
        >
          {valor || "—"}
        </p>
      )}

      <button
        type="button"
        onClick={copiar}
        disabled={vazio}
        title={`Copiar ${rotulo}`}
        aria-label={`Copiar ${rotulo}`}
        className="absolute right-2 top-2 rounded p-1.5 text-[var(--color-text-tertiary)] transition hover:bg-glass-hover hover:text-[var(--color-primary)] disabled:opacity-30"
      >
        {copiado ? <FiCheck size={14} className="text-[var(--color-success)]" /> : <FiCopy size={14} />}
      </button>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-[var(--color-surface-0)] p-3">
      <h4 className="mb-2 text-xs font-bold text-[var(--color-text-primary)]">{titulo}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * Respostas das duas tarefas da verificação do Google Ads, prontas pra copiar.
 * As seleções (owner/company/no/none) são fixas de propósito — é a combinação
 * que passou na análise: empresa opera direto, sem terceiro em nenhuma ponta.
 */
export function RespostasOpcPainel({ respostas }: { respostas: RespostasOpc }) {
  const { operacoes, relacoes } = respostas;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Respostas da verificação (Google Ads)</h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          Os textos você cola; os campos marcados <em>&ldquo;marque a opção&rdquo;</em> são seleções — e são{" "}
          <strong>fixas</strong> (empresa opera direto, sem terceiros), que foi o que passou na análise. O{" "}
          <strong className="text-[var(--color-primary)]">site associado</strong> tem que ser o mesmo domínio da conta.
        </p>
      </div>

      {respostas.aviso_setor && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-2.5 text-xs leading-snug text-[var(--color-primary)]"
        >
          <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{respostas.aviso_setor}</span>
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Bloco titulo="Operações comerciais">
          <Campo rotulo="O que a empresa faz" valor={operacoes.o_que_a_empresa_faz} />
          <Campo rotulo="Estrutura da empresa" valor={operacoes.estrutura_da_empresa} />
          <Campo rotulo="Público-alvo" valor={operacoes.publico_alvo} />
          <Campo rotulo="Modelo de negócio" valor={operacoes.modelo_negocio} selecao />
          <Campo rotulo="Informações adicionais" valor={operacoes.informacoes_adicionais} />
        </Bloco>

        <Bloco titulo="Relações comerciais">
          <Campo rotulo="Quem gerencia o conteúdo" valor={relacoes.quem_gerencia_conteudo} selecao />
          <Campo
            rotulo="Site associado"
            valor={relacoes.site_associado}
            avisoSeVazio="Preencha o domínio onde o site vai ser publicado e gere de novo — sem isso o Google recusa dizendo que o site não está associado à conta."
          />
          <Campo rotulo="Responsável por entrega" valor={relacoes.responsavel_entrega} selecao />
          <Campo rotulo="Uso de outras marcas" valor={relacoes.uso_outras_marcas} selecao />
          <Campo rotulo="Licenças/certificações" valor={relacoes.licencas_certificacoes} selecao />
          <Campo rotulo="Informações adicionais" valor={relacoes.informacoes_adicionais} />
        </Bloco>
      </div>
    </div>
  );
}
