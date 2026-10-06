"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCnpj, parseSites } from "@/lib/sites";

interface SiteRow {
  id: string;
  cnpj: string;
  url: string;
  created_at?: string;
  claimed_at?: string | null;
  claimer?: { name: string } | null;
}

interface SitesPanelProps {
  viewerId: string;
  // true = moderador (cola a lista, vê a fila toda e quem pegou cada um);
  // false = operador (pega 1 por vez e vê só os dele)
  canEdit: boolean;
}

type StatusFilter = "all" | "available" | "claimed";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem clipboard: o texto continua selecionável
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${label}`}
      title={copied ? "Copiado!" : `Copiar ${label}`}
      className={`shrink-0 w-7 h-7 rounded flex items-center justify-center border transition-colors ${
        copied
          ? "border-success/50 text-success bg-success/10"
          : "border-surface-border text-text-tertiary hover:text-primary hover:border-primary/50"
      }`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function SiteCard({ site, onDelete, showClaimer }: { site: SiteRow; onDelete?: () => void; showClaimer?: boolean }) {
  return (
    <div className="glass-static rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 sm:w-64 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-text-disabled">CNPJ</div>
          <div className="text-xs font-mono text-text-primary select-all">{formatCnpj(site.cnpj)}</div>
        </div>
        <CopyButton value={site.cnpj} label="CNPJ (só números)" />
      </div>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-text-disabled">URL</div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-primary hover:underline break-all"
          >
            {site.url}
          </a>
        </div>
        <CopyButton value={site.url} label="URL" />
        {showClaimer && (
          <span className={`badge shrink-0 ${site.claimer ? "badge-primary" : "badge-warning"}`}>
            {site.claimer ? site.claimer.name : "Na fila"}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Remover"
            title="Remover"
            className="shrink-0 w-7 h-7 rounded flex items-center justify-center border border-surface-border text-text-tertiary hover:text-danger hover:border-danger/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function SitesPanel({ viewerId, canEdit }: SitesPanelProps) {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId, ...payload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro na requisição.");
      return body;
    },
    [viewerId]
  );

  const load = useCallback(async () => {
    try {
      const body = await call({ action: "list" });
      setSites(body.sites || []);
      setAvailable(body.available ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar os sites.");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Prévia do que vai ser salvo, enquanto o moderador cola
  const preview = text.trim() ? parseSites(text) : null;

  async function handleAdd() {
    if (!preview || preview.sites.length === 0) return;
    setSaving(true);
    setMsg(null);
    try {
      const body = await call({ action: "add", text });
      const parts = [`${body.added} site(s) adicionado(s) na fila`];
      if (body.duplicates) parts.push(`${body.duplicates} já existiam`);
      if (body.invalid?.length) parts.push(`${body.invalid.length} linha(s) ignorada(s)`);
      setMsg({ type: "success", text: parts.join(" · ") });
      setText("");
      load();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(site: SiteRow) {
    if (!window.confirm(`Remover ${formatCnpj(site.cnpj)}?`)) return;
    try {
      await call({ action: "delete", ids: [site.id] });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao remover." });
    }
  }

  async function handleClaim() {
    setClaiming(true);
    setMsg(null);
    try {
      const body = await call({ action: "claim" });
      setJustClaimed(body.site.id);
      await load();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao pegar o site." });
      load();
    } finally {
      setClaiming(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = sites.filter((s) => {
    if (canEdit) {
      if (status === "available" && s.claimer) return false;
      if (status === "claimed" && !s.claimer) return false;
    }
    if (!q) return true;
    return s.cnpj.includes(q.replace(/\D/g, "") || "\u0000") || s.url.toLowerCase().includes(q);
  });

  const claimedCount = sites.filter((s) => s.claimer).length;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 animate-fade-in">
      {canEdit ? (
        <>
          <div className="glass-static rounded-lg p-5 space-y-3">
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                Adicionar sites na fila
              </h2>
              <p className="text-text-tertiary text-xs mt-0.5">
                Cole a lista: um CNPJ e, na linha de baixo, a URL dele. Os operadores pegam 1 por vez, na ordem em que entraram.
              </p>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={"32103611000151\nhttps://32103611000151.vercel.app/\n\n32170575000149\nhttps://32170575000149.vercel.app/"}
              className="input-base w-full font-mono text-xs resize-y"
              spellCheck={false}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleAdd} disabled={saving || !preview || preview.sites.length === 0} className="btn-primary">
                {saving ? "Salvando..." : preview ? `Adicionar ${preview.sites.length} site(s)` : "Adicionar"}
              </button>
              {preview && (
                <span className="text-[11px] text-text-tertiary">
                  {preview.sites.length} par(es) reconhecido(s)
                  {preview.invalid.length > 0 && (
                    <span className="text-warning"> · {preview.invalid.length} linha(s) não entendida(s)</span>
                  )}
                </span>
              )}
              {msg && (
                <span className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>
                  {msg.text}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por CNPJ ou URL..."
                className="input-base w-full pl-10"
              />
            </div>
            <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1">
              {([
                ["all", `Todos ${sites.length}`],
                ["available", `Na fila ${available}`],
                ["claimed", `Pegos ${claimedCount}`],
              ] as [StatusFilter, string][]).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStatus(v)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    status === v ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="glass-static rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                Sites
              </h2>
              <p className="text-text-tertiary text-xs mt-0.5">
                {available > 0
                  ? `${available} site(s) na fila. Pegue um de cada vez — o que você pegar sai da fila.`
                  : "A fila está vazia no momento."}
              </p>
            </div>
            <button onClick={handleClaim} disabled={claiming || available === 0} className="btn-primary">
              {claiming ? "Pegando..." : "Pegar próximo site"}
            </button>
          </div>
          {msg && <p className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</p>}

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nos meus sites..."
                className="input-base w-full pl-10"
              />
            </div>
            <span className="text-[11px] text-text-disabled font-mono">{filtered.length} meus sites</span>
          </div>
        </>
      )}

      {loading ? (
        <p className="text-text-tertiary text-sm text-center mt-6">Carregando...</p>
      ) : error ? (
        <div className="glass-static rounded-lg p-6 text-center">
          <p className="text-danger text-sm mb-3">{error}</p>
          <button onClick={load} className="btn-ghost text-xs">
            Tentar de novo
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-static rounded-lg p-8 text-center">
          <p className="text-text-primary font-medium mb-1">
            {sites.length === 0 ? (canEdit ? "Nenhum site cadastrado" : "Você ainda não pegou nenhum site") : "Nada encontrado"}
          </p>
          {sites.length === 0 && (
            <p className="text-text-tertiary text-sm">
              {canEdit ? "Cole a lista acima pra começar." : "Clique em “Pegar próximo site” pra receber o primeiro da fila."}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <div key={s.id} className={s.id === justClaimed ? "rounded-lg ring-1 ring-primary/60" : ""}>
              <SiteCard site={s} showClaimer={canEdit} onDelete={canEdit ? () => handleDelete(s) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
