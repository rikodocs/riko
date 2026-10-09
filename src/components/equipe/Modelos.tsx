"use client";

import { useEffect, useState, useCallback } from "react";
import { modelosCall, SECOES, type Modelo } from "./modelos-api";

type Operador = { id: string; name: string; active: boolean };

type Form = {
  id: string | null;
  nome: string;
  operadorId: string;
  palavras_chave: string[];
  titulos: string[];
  descricoes: string[];
};

const vazio = (): Form => ({ id: null, nome: "", operadorId: "", palavras_chave: [""], titulos: [""], descricoes: [""] });

/** Lista dinâmica: um campo por item, botão + pra abrir mais um embaixo, × pra tirar. */
function ListaCampos({
  rotulo,
  singular,
  valores,
  multiline,
  onChange,
}: {
  rotulo: string;
  singular: string;
  valores: string[];
  multiline?: boolean;
  onChange: (v: string[]) => void;
}) {
  const preenchidos = valores.filter((v) => v.trim()).length;
  return (
    <div className="space-y-2 rounded-md border border-surface-border bg-surface-1 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary">
          {rotulo} <span className="font-normal text-text-disabled">({preenchidos})</span>
        </span>
        <button type="button" onClick={() => onChange([...valores, ""])} className="btn-ghost text-xs px-2.5 py-1">
          + {singular}
        </button>
      </div>
      {valores.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="w-5 pt-2 text-[10px] text-text-disabled font-mono text-right shrink-0">{i + 1}</span>
          {multiline ? (
            <textarea
              value={v}
              onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
              rows={2}
              placeholder={`${singular[0].toUpperCase()}${singular.slice(1)} ${i + 1}`}
              className="input-base flex-1 text-xs resize-y"
            />
          ) : (
            <input
              value={v}
              onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`${singular[0].toUpperCase()}${singular.slice(1)} ${i + 1}`}
              className="input-base flex-1 text-xs"
              onKeyDown={(e) => {
                // Enter no último campo já abre o próximo
                if (e.key === "Enter" && i === valores.length - 1) {
                  e.preventDefault();
                  onChange([...valores, ""]);
                }
              }}
            />
          )}
          <button
            type="button"
            onClick={() => onChange(valores.length === 1 ? [""] : valores.filter((_, j) => j !== i))}
            aria-label="Remover"
            className="shrink-0 w-7 h-7 mt-1 rounded flex items-center justify-center border border-surface-border text-text-tertiary hover:text-danger hover:border-danger/50"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** Modelos (fichas) do moderador: nome + listas sem limite, cada ficha ligada a um operador. */
export function Modelos({ viewerId }: { viewerId: string }) {
  const [modelos, setModelos] = useState<Modelo[] | null>(null);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filtroOp, setFiltroOp] = useState("");

  const carregar = useCallback(async () => {
    try {
      const [m, o] = await Promise.all([
        modelosCall<{ modelos: Modelo[] }>(viewerId, { action: "list" }),
        fetch("/api/equipe/operadores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewerId, action: "list" }),
        }).then((r) => r.json()),
      ]);
      setModelos(m.modelos);
      setOperadores((o.operadores as Operador[]) || []);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao carregar." });
      setModelos([]);
    }
  }, [viewerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  function editar(m: Modelo) {
    setForm({
      id: m.id,
      nome: m.nome,
      operadorId: m.operador_id ?? "",
      palavras_chave: m.palavras_chave.length ? [...m.palavras_chave] : [""],
      titulos: m.titulos.length ? [...m.titulos] : [""],
      descricoes: m.descricoes.length ? [...m.descricoes] : [""],
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !form.nome.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await modelosCall(viewerId, {
        action: form.id ? "update" : "add",
        id: form.id,
        nome: form.nome,
        operadorId: form.operadorId || null,
        palavrasChave: form.palavras_chave,
        titulos: form.titulos,
        descricoes: form.descricoes,
      });
      setMsg({ type: "success", text: form.id ? "Modelo atualizado." : "Modelo criado." });
      setForm(null);
      await carregar();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setBusy(false);
    }
  }

  async function excluir(m: Modelo) {
    if (!window.confirm(`Excluir o modelo "${m.nome}"?`)) return;
    setBusy(true);
    try {
      await modelosCall(viewerId, { action: "delete", id: m.id });
      setMsg({ type: "success", text: "Modelo excluído." });
      await carregar();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao excluir." });
    } finally {
      setBusy(false);
    }
  }

  const visiveis = (modelos || []).filter((m) => !filtroOp || m.operador_id === filtroOp);

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-tertiary">
        Fichas com palavras-chave, títulos e descrições. Dê um nome que diga do que se trata (ex.: &ldquo;Modelo 1&rdquo;, &ldquo;Teste Rocha Blog&rdquo;) e ligue a um
        operador — ele vê a ficha em <code className="font-mono">/operacao</code> e copia cada item.
      </p>

      {form ? (
        <form onSubmit={salvar} className="space-y-3 rounded-md border border-primary/40 bg-surface-0 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Nome do modelo</span>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Teste Rocha Blog" className="input-base w-full" autoFocus />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Operador</span>
              <select value={form.operadorId} onChange={(e) => setForm({ ...form, operadorId: e.target.value })} className="input-base w-full">
                <option value="">— nenhum ainda —</option>
                {operadores.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {!o.active ? " (inativo)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {SECOES.map((s) => (
            <ListaCampos
              key={s.chave}
              rotulo={s.rotulo}
              singular={s.singular}
              valores={form[s.chave]}
              multiline={s.chave === "descricoes"}
              onChange={(v) => setForm({ ...form, [s.chave]: v })}
            />
          ))}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy || !form.nome.trim()} className="btn-primary">
              {busy ? "Salvando..." : form.id ? "Salvar alterações" : "Criar modelo"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost text-xs">
              Cancelar
            </button>
            {msg && <span className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</span>}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setForm(vazio())} className="btn-primary">
            + Novo modelo
          </button>
          <select value={filtroOp} onChange={(e) => setFiltroOp(e.target.value)} className="input-base !py-1.5 text-xs">
            <option value="">Todos os operadores</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {msg && <span className={`text-xs font-medium ${msg.type === "success" ? "text-success" : "text-danger"}`}>{msg.text}</span>}
        </div>
      )}

      {modelos === null ? (
        <p className="text-xs text-text-tertiary">Carregando...</p>
      ) : visiveis.length === 0 ? (
        <p className="text-xs text-text-tertiary">{modelos.length === 0 ? "Nenhum modelo ainda. Crie o primeiro acima." : "Nenhum modelo pra esse operador."}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visiveis.map((m) => (
            <div key={m.id} className="rounded-md border border-surface-border bg-surface-1 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{m.nome}</p>
                  <p className="text-[11px] text-text-tertiary">{m.operador ? `Operador: ${m.operador}` : "Sem operador"}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" disabled={busy} onClick={() => editar(m)} className="btn-ghost text-xs px-2 py-1">
                    Editar
                  </button>
                  <button type="button" disabled={busy} onClick={() => excluir(m)} className="btn-ghost text-xs px-2 py-1 hover:text-danger">
                    Excluir
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-[11px] text-text-tertiary font-mono">
                <span>{m.palavras_chave.length} palavras</span>
                <span>{m.titulos.length} títulos</span>
                <span>{m.descricoes.length} descrições</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
