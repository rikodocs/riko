"use client";

import { useState } from "react";
import { FiZap, FiDownload } from "react-icons/fi";
import { formatCnpj } from "@/lib/cnpj/brasilapi";
import { RespostasOpcPainel } from "@/components/ia/RespostasOpcPainel";
import type { RespostasOpc } from "@/lib/ia/gerar-index";

type Resultado = { html: string; empresa: string; respostas?: RespostasOpc; casoSalvo?: boolean };

/** Testar gerador (trazido da Mikey Ads): cola um CNPJ, escolhe o modelo e vê/baixa o site + respostas. */
export function TesteGerador({ viewerId }: { viewerId: string }) {
  const [cnpj, setCnpj] = useState("");
  const [escolha, setEscolha] = useState("opc_aprovacao2");
  const [emailModo, setEmailModo] = useState("dominio");
  const [tamanho, setTamanho] = useState("completa");
  const [dominio, setDominio] = useState("");
  const [permitirInativa, setPermitirInativa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [res, setRes] = useState<Resultado | null>(null);

  const cnpjOk = cnpj.replace(/\D/g, "").length === 14;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRes(null);
    setBusy(true);
    try {
      const r = await fetch("/api/ferramentas/gerar-teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId, cnpj, escolha, dominio, emailModo, tamanho, permitirInativa }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Erro ao gerar.");
      setRes(body);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar.");
    } finally {
      setBusy(false);
    }
  }

  function baixar() {
    if (!res) return;
    const blob = new Blob([res.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `index-${cnpj.replace(/\D/g, "")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Cola um CNPJ e gera um site no nicho dele pra conferir — <strong className="text-text-secondary">Cliente</strong>{" "}
        (site institucional) ou <strong className="text-text-secondary">OPC</strong>. Nos OPC vêm junto as respostas do
        formulário de verificação do Google.
      </p>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <input
          value={cnpj}
          onChange={(e) => setCnpj(formatCnpj(e.target.value))}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          className="input-base mono-input w-full"
        />
        <select value={escolha} onChange={(e) => setEscolha(e.target.value)} className="input-base w-full">
          <option value="opc_aprovacao2">OPC 2.0 — conformidade reforçada</option>
          <option value="opc_aprovacao">OPC (Aprovação)</option>
          <option value="opc_suspensao">OPC — Suspensão (template antigo)</option>
          <option value="cliente">Cliente — site institucional rico</option>
        </select>
        <select value={emailModo} onChange={(e) => setEmailModo(e.target.value)} className="input-base w-full">
          <option value="dominio">E-mail do domínio (contato@…)</option>
          <option value="real">E-mail real do CNPJ</option>
        </select>
        <select value={tamanho} onChange={(e) => setTamanho(e.target.value)} className="input-base w-full">
          <option value="completa">Respostas completas (1-2 frases)</option>
          <option value="curta">Respostas curtas (1 frase seca)</option>
        </select>
        <label className="sm:col-span-2 flex flex-col gap-1">
          <input
            value={dominio}
            onChange={(e) => setDominio(e.target.value)}
            placeholder="dominio-onde-vai-publicar.com.br"
            className="input-base w-full"
          />
          <span className="text-[11px] text-text-tertiary">
            Preencha com o <strong className="text-primary">domínio onde o site vai ser publicado</strong> — ele vira o
            &ldquo;site associado&rdquo; nas respostas (se não bater com a conta, o Google recusa).
          </span>
        </label>
        <label className="sm:col-span-2 flex items-start gap-2 text-[11px] text-text-tertiary">
          <input
            type="checkbox"
            checked={permitirInativa}
            onChange={(e) => setPermitirInativa(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong className="text-text-secondary">Gerar mesmo com empresa não ativa</strong> (baixada/inapta/suspensa
            na Receita). Use só de propósito — a aprovação costuma ser pior.
          </span>
        </label>
        {erro && (
          <p className="sm:col-span-2 text-xs text-danger font-medium" role="alert">
            {erro}
          </p>
        )}
        <div className="flex justify-end sm:col-span-2">
          <button type="submit" disabled={busy || !cnpjOk} className="btn-primary">
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Gerando... (pode levar até 1 min)
              </>
            ) : (
              <>
                <FiZap size={15} /> Gerar teste
              </>
            )}
          </button>
        </div>
      </form>

      {res && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-tertiary truncate">{res.empresa}</span>
            <button type="button" onClick={baixar} className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1">
              <FiDownload size={13} /> Baixar index.html
            </button>
          </div>
          <iframe
            title="Preview do site gerado"
            srcDoc={res.html}
            sandbox=""
            className="h-[420px] w-full rounded-md border border-surface-border bg-white"
          />
          {res.respostas && (
            <>
              <RespostasOpcPainel respostas={res.respostas} />
              <p className="text-[11px] text-text-tertiary">
                {res.casoSalvo
                  ? "Caso salvo automaticamente — marque aprovou/recusou na aba Casos OPC."
                  : "Não consegui salvar o caso automaticamente (rode a migration V15?)."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
