"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (data) {
      setApiUrl(data.api_url || "");
      setApiToken(data.api_token || "");
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("settings")
      .upsert(
        { id: 1, api_url: apiUrl.trim(), api_token: apiToken.trim(), updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: `Erro ao salvar: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="glass-static rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-heading)" }}>
            API de Consulta
          </h2>
          <p className="text-text-tertiary text-xs mt-0.5">
            Configure a URL e o token da API OwnData para consultas
          </p>
        </div>

        {/* API URL */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-secondary">
            URL da API
          </label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://completa.workbuscas.com/api"
            className="input-base w-full"
          />
          <p className="text-[11px] text-text-disabled">
            Exemplo: https://completa.workbuscas.com/api
          </p>
        </div>

        {/* API Token */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-secondary">
            Token de Autenticação
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Seu token da API"
              className="input-base w-full pr-12"
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

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </button>
          {message && (
            <span className={`text-xs font-medium animate-fade-in ${
              message.type === "success" ? "text-success" : "text-danger"
            }`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
