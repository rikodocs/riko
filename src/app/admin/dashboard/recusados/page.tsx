"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface RejectedDoc {
  id: string;
  file_name: string;
  file_url: string | null;
  file_type: string | null;
  cpf_extracted: string | null;
  reject_reason: string | null;
  moderated_at: string | null;
  created_at: string;
  moderador: { name: string } | null;
}

type ReasonFilter = "all" | "duplicate" | "invalid";

function formatCpf(cpf: string | null) {
  const d = (cpf || "").replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf || "—";
}

export default function RecusadosPage() {
  const [docs, setDocs] = useState<RejectedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState<ReasonFilter>("all");
  const [preview, setPreview] = useState<RejectedDoc | null>(null);

  const load = useCallback(async () => {
    // Três FKs pra viewer_users em documents — precisa dizer qual é
    const { data } = await supabase
      .from("documents")
      .select(
        "id, file_name, file_url, file_type, cpf_extracted, reject_reason, moderated_at, created_at, moderador:viewer_users!moderated_by(name)"
      )
      .eq("status", "rejected_mod")
      .order("moderated_at", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDocs(((data as any[]) || []).map((d) => ({ ...d, moderador: Array.isArray(d.moderador) ? d.moderador[0] ?? null : d.moderador })));
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = docs.filter((d) => {
    if (reason !== "all" && (d.reject_reason || "invalid") !== reason) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.file_name.toLowerCase().includes(q) ||
      (d.cpf_extracted || "").includes(q.replace(/\D/g, "")) ||
      (d.moderador?.name || "").toLowerCase().includes(q)
    );
  });

  const dupCount = docs.filter((d) => d.reject_reason === "duplicate").length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {[
          { label: "Recusados", value: docs.length, color: "text-danger" },
          { label: "Duplicados", value: dupCount, color: "text-warning" },
          { label: "Inválidos", value: docs.length - dupCount, color: "text-text-secondary" },
        ].map((c) => (
          <div key={c.label} className="glass-static rounded-lg p-4">
            <p className="text-text-tertiary text-[11px] uppercase tracking-[0.1em] font-medium mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              {c.label}
            </p>
            <p className={`text-2xl font-bold ${c.color}`} style={{ fontFamily: "var(--font-heading)" }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por arquivo, CPF ou moderador..."
            className="input-base w-full pl-10"
          />
        </div>
        <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1">
          {([
            ["all", "Todos"],
            ["duplicate", "Duplicados"],
            ["invalid", "Inválidos"],
          ] as [ReasonFilter, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setReason(v)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                reason === v ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-text-disabled font-mono">{filtered.length} docs</span>
      </div>

      <div className="glass-static rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-text-tertiary text-sm p-6">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-tertiary text-sm p-6">
            {docs.length === 0 ? "Nenhum documento recusado pelo moderador." : "Nada encontrado com esse filtro."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-tertiary text-xs uppercase tracking-wider border-b border-surface-border">
                <th className="p-4">Arquivo</th>
                <th className="p-4">CPF</th>
                <th className="p-4">Motivo</th>
                <th className="p-4">Moderador</th>
                <th className="p-4">Quando</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-surface-border last:border-0">
                  <td className="p-4 text-text-primary max-w-[260px] truncate" title={d.file_name}>
                    {d.file_name}
                  </td>
                  <td className="p-4 font-mono text-text-secondary">{formatCpf(d.cpf_extracted)}</td>
                  <td className="p-4">
                    <span className={`badge ${d.reject_reason === "duplicate" ? "badge-warning" : "badge-danger"}`}>
                      {d.reject_reason === "duplicate" ? "CPF duplicado" : "Inválido"}
                    </span>
                  </td>
                  <td className="p-4 text-text-secondary">{d.moderador?.name || "—"}</td>
                  <td className="p-4 text-text-tertiary text-xs">
                    {d.moderated_at ? new Date(d.moderated_at).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setPreview(d)} className="btn-ghost text-xs px-3 py-1.5">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
            }}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-1 border border-surface-border text-text-primary flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-[95vw] max-h-[90vh] w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
            {preview.file_url ? (
              preview.file_type === "application/pdf" ? (
                <iframe src={preview.file_url} title={preview.file_name} className="w-[90vw] h-[85vh] rounded-md bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.file_url} alt={preview.file_name} className="max-w-[95vw] max-h-[90vh] object-contain rounded-md" />
              )
            ) : (
              <p className="text-text-tertiary text-sm">Arquivo sem URL.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
