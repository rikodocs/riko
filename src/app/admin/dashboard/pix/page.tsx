"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PixResult = { qrcode: string; copyPaste: string; valor: number };

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatTelefone(tel: string) {
  const d = tel.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 123456 centavos → "1.234,56"
function formatValor(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PixPage() {
  // Config fixa (salva em settings)
  const [token, setToken] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Geração
  const [valorCentavos, setValorCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PixResult | null>(null);
  const [copied, setCopied] = useState(false);

  const cpfDigits = cpf.replace(/\D/g, "");
  const telDigits = telefone.replace(/\D/g, "");
  const configValid = !!token.trim() && cpfDigits.length === 11 && (telDigits.length === 10 || telDigits.length === 11);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("settings")
      .select("pix_api_token, pix_cpf, pix_telefone")
      .eq("id", 1)
      .single();
    const t = data?.pix_api_token || "";
    const c = data?.pix_cpf || "";
    const p = data?.pix_telefone || "";
    setToken(t);
    setCpf(c);
    setTelefone(p);
    // Se ainda não tem config completa, já abre o formulário
    setEditing(!(t && c.length === 11 && p.length >= 10));
    setLoaded(true);
  }

  async function handleSaveConfig() {
    if (!configValid) {
      setConfigMsg({ type: "error", text: "Preencha token, CPF (11 dígitos) e telefone (10 ou 11 dígitos)." });
      return;
    }
    setSaving(true);
    setConfigMsg(null);
    const { error } = await supabase
      .from("settings")
      .update({
        pix_api_token: token.trim(),
        pix_cpf: cpfDigits,
        pix_telefone: telDigits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setConfigMsg({ type: "error", text: `Erro ao salvar: ${error.message}` });
      return;
    }
    setCpf(cpfDigits);
    setTelefone(telDigits);
    setEditing(false);
    setConfigMsg({ type: "success", text: "Dados do PIX salvos!" });
    setTimeout(() => setConfigMsg(null), 3000);
  }

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    if (valorCentavos < 1) {
      setError("Digite um valor maior que R$ 0,00");
      return;
    }
    const v = valorCentavos / 100;

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/gerar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: v, descricao: descricao.trim() || "Pagamento" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");
      setResult({ qrcode: data.qrcode, copyPaste: data.copyPaste, valor: data.valor });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Config fixa */}
      <div className="glass-static rounded-lg p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-[15px] font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Dados fixos do PIX
            </h2>
            <p className="text-text-tertiary text-xs mt-0.5">
              Token da Ativopay, CPF e telefone usados em todo PIX gerado
            </p>
          </div>
          {loaded && !editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn-ghost text-xs">
              Editar
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-secondary">Token da API (Ativopay)</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Seu token da Ativopay"
                  className="input-base w-full pr-12"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
                  aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                >
                  {showToken ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-text-secondary">CPF</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="input-base w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-text-secondary">Telefone</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="input-base w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleSaveConfig} disabled={saving} className="btn-primary">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
              {configMsg && (
                <span
                  className={`text-xs font-medium animate-fade-in ${
                    configMsg.type === "success" ? "text-success" : "text-danger"
                  }`}
                >
                  {configMsg.text}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-2.5">
              <div className="text-text-disabled mb-0.5">Token</div>
              <div className="text-text-primary font-mono">••••{token.slice(-4)}</div>
            </div>
            <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-2.5">
              <div className="text-text-disabled mb-0.5">CPF</div>
              <div className="text-text-primary font-mono">{formatCpf(cpf)}</div>
            </div>
            <div className="rounded-md border border-surface-border bg-surface-1 px-3 py-2.5">
              <div className="text-text-disabled mb-0.5">Telefone</div>
              <div className="text-text-primary font-mono">{formatTelefone(telefone)}</div>
            </div>
            {configMsg && (
              <span
                className={`sm:col-span-3 text-xs font-medium animate-fade-in ${
                  configMsg.type === "success" ? "text-success" : "text-danger"
                }`}
              >
                {configMsg.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Geração */}
      <div className="glass-static rounded-lg p-6 space-y-5">
        <div>
          <h2
            className="text-[15px] font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Gerar PIX
          </h2>
          <p className="text-text-tertiary text-xs mt-0.5">
            Gera um QR Code e o copia e cola (válido por 1 dia)
          </p>
        </div>

        <form onSubmit={handleGerar} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Valor (R$)</label>
            {/* Máscara de moeda: digita só números e preenche da direita (1 → 0,01; 1050 → 10,50) */}
            <div className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-4 transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-ring),0_0_12px_var(--color-primary-glow)]">
              <span className="text-sm font-semibold text-primary select-none">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={valorCentavos ? formatValor(valorCentavos) : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
                  setValorCentavos(digits ? parseInt(digits, 10) : 0);
                }}
                placeholder="0,00"
                className="flex-1 min-w-0 bg-transparent py-2.5 text-sm text-text-primary placeholder:text-text-disabled outline-none tabular-nums"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">Descrição (opcional)</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento de serviço"
              className="input-base w-full"
            />
          </div>

          <button
            type="submit"
            disabled={generating || !configValid || editing}
            className="btn-primary"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Gerando PIX...
              </>
            ) : (
              "Gerar PIX"
            )}
          </button>
          {loaded && (!configValid || editing) && (
            <p className="text-[11px] text-text-disabled">
              Salve os dados fixos acima para liberar a geração.
            </p>
          )}
        </form>

        {error && (
          <div className="rounded-md border border-danger/40 bg-danger-muted px-4 py-3 text-xs text-danger animate-fade-in break-words">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-4 border-t border-surface-border animate-fade-in">
            <div className="text-center text-sm text-text-secondary">
              PIX de <span className="font-semibold text-text-primary">{formatBRL(result.valor)}</span>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.qrcode}
                alt="QR Code PIX"
                className="w-64 max-w-full rounded-md bg-white p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-secondary">Copia e Cola</label>
              <div className="rounded-md border border-surface-border bg-surface-1 p-3 font-mono text-[11px] text-text-primary break-all select-all">
                {result.copyPaste}
              </div>
              <button type="button" onClick={handleCopy} className="btn-primary w-full">
                {copied ? "Copiado!" : "Copiar Copia e Cola"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
