"use client";

import { useEffect, useState, useCallback } from "react";
import { modelosCall, SECOES, type Modelo } from "./modelos-api";

function CopyButton({ value, label, texto }: { value: string; label: string; texto?: string }) {
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
      className={`shrink-0 h-7 ${texto ? "px-2" : "w-7"} rounded flex items-center justify-center gap-1 border text-[11px] transition-colors ${
        copied ? "border-success/50 text-success bg-success/10" : "border-surface-border text-text-tertiary hover:text-primary hover:border-primary/50"
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
      {texto && <span>{copied ? "Copiado" : texto}</span>}
    </button>
  );
}

/** Modelos do operador: fichas que o moderador ligou a ele, com copiar por item e por seção. */
export function ModelosOperador({ viewerId }: { viewerId: string }) {
  const [modelos, setModelos] = useState<Modelo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const b = await modelosCall<{ modelos: Modelo[] }>(viewerId, { action: "list" });
      setModelos(b.modelos);
      setAberto((a) => a ?? b.modelos[0]?.id ?? null);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  if (erro) return <p className="text-xs text-danger">{erro}</p>;
  if (modelos === null) return <p className="text-xs text-text-tertiary">Carregando...</p>;
  if (modelos.length === 0) return <p className="text-xs text-text-tertiary">Nenhum modelo ligado a você ainda. O moderador cadastra em Equipe → Modelos.</p>;

  return (
    <div className="space-y-3">
      {modelos.map((m) => {
        const isOpen = aberto === m.id;
        return (
          <div key={m.id} className="rounded-md border border-surface-border bg-surface-1">
            <button type="button" onClick={() => setAberto(isOpen ? null : m.id)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
              <span className="text-sm font-semibold text-text-primary">{m.nome}</span>
              <span className="text-[11px] text-text-tertiary font-mono">
                {m.palavras_chave.length} palavras · {m.titulos.length} títulos · {m.descricoes.length} descrições {isOpen ? "▾" : "▸"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-surface-border p-4 space-y-4">
                {SECOES.map((s) => {
                  const itens = m[s.chave];
                  return (
                    <div key={s.chave} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                          {s.rotulo} ({itens.length})
                        </span>
                        {itens.length > 1 && <CopyButton value={itens.join("\n")} label={`todas as ${s.rotulo.toLowerCase()}`} texto="Copiar todas" />}
                      </div>
                      {itens.length === 0 ? (
                        <p className="text-xs text-text-disabled">—</p>
                      ) : (
                        <div className="space-y-1.5">
                          {itens.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-md border border-surface-border bg-surface-0 px-3 py-2">
                              <span className="text-[10px] text-text-disabled font-mono pt-0.5 w-5 text-right shrink-0">{i + 1}</span>
                              <p className="flex-1 text-xs text-text-primary whitespace-pre-wrap break-words select-all">{item}</p>
                              <CopyButton value={item} label={`${s.singular} ${i + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
