"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DocRecord {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
}

export default function ImportsPage() {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [recentDocs, setRecentDocs] = useState<DocRecord[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; failed: number } | null>(null);

  useEffect(() => {
    loadRecentDocs();
  }, []);

  async function loadRecentDocs() {
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, status, created_at")
      .in("status", ["pending", "consulted", "used", "manual_review"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRecentDocs(data);
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      setMessage({ type: "error", text: "Envie apenas imagens ou PDFs." });
      return;
    }

    setUploading(true);
    setMessage(null);
    setProgress({ current: 0, total: validFiles.length, failed: 0 });
    let successCount = 0;
    let failedCount = 0;
    const skippedDuplicates: string[] = [];

    // Helper: upload a single file with retry logic
    async function uploadWithRetry(file: File, index: number, maxRetries = 3): Promise<boolean> {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        || "doc";
      const fileName = `${Date.now()}_${index}_${baseName}.${ext}`;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);

          if (uploadError) {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
              continue;
            }
            return false;
          }

          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName);

          const { error: insertError } = await supabase.from("documents").insert({
            file_name: file.name,
            file_path: fileName,
            file_url: urlData.publicUrl,
            file_type: file.type,
            status: "pending",
          });

          return !insertError;
        } catch {
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          return false;
        }
      }
      return false;
    }

    try {
      for (let fi = 0; fi < validFiles.length; fi++) {
        const file = validFiles[fi];
        setProgress({ current: fi + 1, total: validFiles.length, failed: failedCount });

        try {
          // Check duplicate by original file name across ALL documents
          const { count: nameCount } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("file_name", file.name);

          if (nameCount && nameCount > 0) {
            skippedDuplicates.push(file.name);
            continue;
          }

          const ok = await uploadWithRetry(file, fi);
          if (ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }

        // Small delay every 10 files to avoid overwhelming Supabase
        if ((fi + 1) % 10 === 0 && fi + 1 < validFiles.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: `Erro inesperado: ${msg}` });
    }

    setUploading(false);
    setProgress(null);

    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} importado(s)`);
    if (skippedDuplicates.length > 0) parts.push(`${skippedDuplicates.length} duplicado(s)`);
    if (failedCount > 0) parts.push(`${failedCount} falha(s) no upload`);

    if (parts.length > 0) {
      setMessage({
        type: failedCount > 0 && successCount === 0 ? "error" : successCount > 0 ? "success" : "error",
        text: parts.join(" | "),
      });
    }
    if (successCount > 0) loadRecentDocs();
  }, []);

  // Paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const ext = file.type.split("/")[1] || "png";
            const named = new File([file], `colado_${Date.now()}.${ext}`, { type: file.type });
            files.push(named);
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const statusBadge = (status: string) => {
    const config: Record<string, { cls: string; label: string }> = {
      pending: { cls: "badge-warning", label: "Pendente" },
      consulted: { cls: "badge-primary", label: "Consultado" },
      used: { cls: "badge-success", label: "Usado" },
      error: { cls: "badge-danger", label: "Erro" },
      duplicate: { cls: "badge-danger", label: "Duplicado" },
      manual_review: { cls: "badge-danger", label: "Revisão Manual" },
    };
    const c = config[status] || { cls: "", label: status };
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`glass-static rounded-2xl p-12 text-center transition-all duration-200 ${
          dragActive ? "border-primary bg-primary-muted !border-primary" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            dragActive ? "bg-primary-muted" : "bg-glass"
          }`}>
            <svg
              className={`w-6 h-6 ${dragActive ? "text-primary" : "text-text-tertiary"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-text-secondary text-sm font-medium">
              Arraste e solte documentos aqui ou cole com Ctrl+V
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              Aceita imagens (JPG, PNG) e PDFs
            </p>
          </div>
          <label className="btn-primary cursor-pointer text-sm">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Selecionar Arquivos
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="glass-static rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-[13px] font-medium">
              Enviando {progress.current} de {progress.total}...
            </span>
            <span className="text-text-disabled text-[11px] font-mono">
              {Math.round((progress.current / progress.total) * 100)}%
              {progress.failed > 0 && <span className="text-danger ml-2">({progress.failed} falha{progress.failed > 1 ? "s" : ""})</span>}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-medium animate-fade-in ${
            message.type === "success"
              ? "bg-success-muted text-success border border-success/20"
              : "bg-danger-muted text-danger border border-danger/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Recent imports */}
      <div className="glass-static rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-[13px] font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-heading)" }}>
            Importações Recentes
          </h2>
        </div>
        {recentDocs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-tertiary text-sm">Nenhum documento importado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentDocs.map((doc, i) => (
              <div key={doc.id} className={`px-5 py-3 flex items-center justify-between hover:bg-glass-hover transition-colors stagger-item`}
                   style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-glass flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-text-secondary truncate">
                    {doc.file_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {statusBadge(doc.status)}
                  <span className="text-[11px] text-text-disabled font-mono">
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
