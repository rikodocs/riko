"use client";

import { useState } from "react";
import { FiCopy, FiCheck, FiAlertTriangle } from "react-icons/fi";
import type { RespostasOpcLongo } from "@/lib/ia/gerar-index";

type CampoProps = {
  numero: number;
  rotulo: string;
  valor: string;
  selecao?: boolean;
  avisoSeVazio?: string;
};

function Campo({ numero, rotulo, valor, selecao, avisoSeVazio }: CampoProps) {
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
        {numero}. {rotulo}
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
 * Respostas do formulário LONGO da OPC (29 perguntas) — versão mais recente que
 * o Google às vezes mostra no lugar do formulário de 2 tarefas. As perguntas de
 * upload de documento (4, 16, 28) não entram aqui: continuam manuais.
 */
export function RespostasOpcLongoPainel({ respostas }: { respostas: RespostasOpcLongo }) {
  const { parte1, parte2, parte3, parte4, parte5 } = respostas;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          Respostas da OPC Antiga (29 perguntas)
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          Os textos você cola; os campos <em>&ldquo;marque a opção&rdquo;</em> são seleções — <strong>fixas</strong> de
          propósito (empresa própria, direta, sem terceiros). Os uploads de documento (perguntas 4, 16 e 28) continuam
          manuais.
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
        <Bloco titulo="Parte 1 — sobre o anunciante">
          <Campo numero={2} rotulo="Site associado" valor={parte1.site_associado} avisoSeVazio="Preencha o domínio onde o site vai ser publicado e gere de novo." />
          <Campo numero={3} rotulo="O site ainda é usado?" valor={parte1.site_ainda_usado} selecao />
          <Campo numero={4} rotulo="Seu uso do Google Ads" valor={parte1.uso_google_ads} selecao />
          <Campo numero={4} rotulo="Nome comercial (tem que bater com o documento)" valor={parte1.nome_comercial} />
          <Campo numero={4} rotulo="Onde a empresa está registrada" valor={parte1.pais_registro} selecao />
          <Campo numero={5} rotulo="Outra empresa gerencia campanhas?" valor={parte1.outra_empresa_gerencia_campanhas} selecao />
        </Bloco>

        <Bloco titulo="Parte 2 — sobre você">
          <Campo numero={6} rotulo="Seu nome" valor={parte2.seu_nome} avisoSeVazio="Preencha o nome de quem faz login e gere de novo." />
          <Campo numero={7} rotulo="Nome da sua empresa" valor={parte2.nome_empresa} />
          <Campo numero={8} rotulo="Endereço da sua empresa" valor={parte2.endereco_empresa} />
          <Campo numero={9} rotulo="Cidade da sua empresa" valor={parte2.cidade_empresa} />
          <Campo numero={10} rotulo="CEP da empresa" valor={parte2.cep_empresa} />
          <Campo numero={11} rotulo="E-mail de login no Google Ads" valor={parte2.email_login} avisoSeVazio="Preencha o e-mail de login da conta e gere de novo." />
        </Bloco>

        <Bloco titulo="Parte 3 — modelo de negócio e parcerias">
          <Campo numero={12} rotulo="Tipo da empresa" valor={parte3.tipo_empresa} />
          <Campo numero={13} rotulo="Modelo de negócio" valor={parte3.modelo_negocio} />
          <Campo numero={14} rotulo="Clientes / público-alvo" valor={parte3.publico_alvo} />
          <Campo numero={15} rotulo="Interação com o público" valor={parte3.interacao_publico} />
          <Campo numero={16} rotulo="Tipo de organização" valor={parte3.tipo_organizacao} selecao />
          <Campo numero={16} rotulo="Empresa terceira entrega no seu lugar?" valor={parte3.terceiro_entrega} selecao />
          <Campo numero={17} rotulo="Outras relações (produtos/serviços)?" valor={parte3.outras_relacoes_produtos} selecao />
          <Campo numero={18} rotulo="É agência de publicidade/afiliada?" valor={parte3.agencia_publicidade} selecao />
          <Campo numero={18} rotulo="Agência externa loga na conta?" valor={parte3.agencia_login_conta} selecao />
          <Campo numero={18} rotulo="Outras partes gerenciam o conteúdo?" valor={parte3.outras_partes_conteudo} selecao />
        </Bloco>

        <Bloco titulo="Parte 4 — perguntas centrais">
          <Campo numero={19} rotulo="Como o público recebe o produto/serviço" valor={parte4.como_recebe_produtos} />
          <Campo numero={20} rotulo="Quem cria o conteúdo do anúncio" valor={parte4.quem_cria_conteudo_anuncio} selecao />
          <Campo numero={21} rotulo="Quem cria o conteúdo do site" valor={parte4.quem_cria_conteudo_site} selecao />
          <Campo numero={22} rotulo="Responsável em caso de problema" valor={parte4.responsavel_problemas} selecao />
          <Campo numero={23} rotulo="Outras partes fazem login?" valor={parte4.outras_partes_login} selecao />
          <Campo numero={24} rotulo="Outras relações (marca)?" valor={parte4.outras_relacoes_marca} selecao />
          <Campo numero={25} rotulo="Quem paga pela conta" valor={parte4.quem_paga} />
          <Campo numero={26} rotulo="Licenças/certificações" valor={parte4.licencas} selecao />
          {parte4.licenca_especifica !== undefined && (
            <Campo numero={26} rotulo="Qual é a licença/certificação e o nº" valor={parte4.licenca_especifica} />
          )}
          {parte4.licenca_detentor !== undefined && (
            <Campo numero={26} rotulo="Quem detém a licença" valor={parte4.licenca_detentor} />
          )}
          <Campo numero={27} rotulo="Proteção de dados pessoais" valor={parte4.protecao_dados} />
          <Campo numero={27} rotulo="Link da política de privacidade" valor={parte4.link_privacidade} />
        </Bloco>
      </div>

      <Bloco titulo="Parte 5 — encerramento">
        <Campo numero={29} rotulo="Comentários finais" valor={parte5.comentarios_finais} />
      </Bloco>
    </div>
  );
}
