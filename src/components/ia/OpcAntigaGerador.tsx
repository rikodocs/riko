"use client";

import { useState } from "react";
import { ROTULO_LICENCA_OPC, type RespostasOpcLongo, type TipoLicencaOpc } from "@/lib/ia/gerar-index";
import { formatCnpj } from "@/lib/cnpj/brasilapi";
import { RespostasOpcLongoPainel } from "@/components/ia/RespostasOpcLongoPainel";

const OPCOES_LICENCA = Object.entries(ROTULO_LICENCA_OPC) as [TipoLicencaOpc, string][];

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

/** OPC Antiga (formulário de 29 perguntas) — trazido da Mikey Ads. */
export function OpcAntigaGerador({ viewerId }: { viewerId: string }) {
  const [cnpj, setCnpj] = useState("");
  const [dominio, setDominio] = useState("");
  const [seuNome, setSeuNome] = useState("");
  const [emailLogin, setEmailLogin] = useState("");
  const [licencaTipo, setLicencaTipo] = useState<TipoLicencaOpc>("nenhuma");
  const [licencaEspecifica, setLicencaEspecifica] = useState("");
  const [licencaDetentor, setLicencaDetentor] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<RespostasOpcLongo | null>(null);

  const cnpjOk = cnpj.replace(/\D/g, "").length === 14;
  const temLicenca = licencaTipo !== "nenhuma";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setRespostas(null);
    setBusy(true);
    try {
      const r = await fetch("/api/ferramentas/opc-antiga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId, cnpj, dominio, seuNome, emailLogin, licencaTipo, licencaEspecifica, licencaDetentor }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Erro ao gerar.");
      setRespostas(body.respostas);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Versão antiga/detalhada da verificação de operações comerciais que o Google às vezes mostra. Só precisa do CNPJ e
        de 2 dados que só você sabe (quem loga e com qual e-mail).
      </p>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Campo label="CNPJ">
          <input
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            className="input-base mono-input w-full"
          />
        </Campo>
        <Campo label="Domínio (site associado)">
          <input value={dominio} onChange={(e) => setDominio(e.target.value)} placeholder="dominio-onde-publica.com.br" className="input-base w-full" />
        </Campo>
        <Campo label="Seu nome (quem faz login)">
          <input value={seuNome} onChange={(e) => setSeuNome(e.target.value)} placeholder="Nome de quem loga na conta" className="input-base w-full" />
        </Campo>
        <Campo label="E-mail de login no Google Ads">
          <input type="email" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} placeholder="conta@gmail.com" className="input-base w-full" />
        </Campo>

        <div className="sm:col-span-2">
          <Campo label="Licença/certificação (pergunta 26)">
            <select value={licencaTipo} onChange={(e) => setLicencaTipo(e.target.value as TipoLicencaOpc)} className="input-base w-full">
              {OPCOES_LICENCA.map(([tipo, rotulo]) => (
                <option key={tipo} value={tipo}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {temLicenca && (
          <>
            <Campo label="Qual é a licença/certificação e o nº">
              <input value={licencaEspecifica} onChange={(e) => setLicencaEspecifica(e.target.value)} placeholder="Ex.: Advogados do Brasil (OAB/MG) — nº 108762" className="input-base w-full" />
            </Campo>
            <Campo label="Quem detém a licença (opcional)">
              <input value={licencaDetentor} onChange={(e) => setLicencaDetentor(e.target.value)} placeholder="Padrão: a própria empresa" className="input-base w-full" />
            </Campo>
          </>
        )}

        {erro && (
          <p className="text-xs text-danger font-medium sm:col-span-2" role="alert">
            {erro}
          </p>
        )}

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={busy || !cnpjOk || !seuNome.trim() || !emailLogin.trim() || (temLicenca && !licencaEspecifica.trim())}
            className="btn-primary"
          >
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar respostas"
            )}
          </button>
        </div>
      </form>

      {respostas && (
        <div className="animate-fade-in">
          <RespostasOpcLongoPainel respostas={respostas} />
        </div>
      )}
    </div>
  );
}
