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

  useEffect(() => {
    loadRecentDocs();
  }, []);

  async function loadRecentDocs() {
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRecentDocs(data);
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      setMessage({ type: "error", text: "Envie apenas imagens ou PDFs." });
      return;
    }

    setUploading(true);
    setMessage(null);
    let successCount = 0;
    const errors: string[] = [];

    try {
      for (const file of validFiles) {
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          errors.push(`Upload "${file.name}": ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        // Insert record
        const { error: insertError } = await supabase.from("documents").insert({
          file_name: file.name,
          file_path: fileName,
          file_url: urlData.publicUrl,
          file_type: file.type,
          status: "pending",
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          errors.push(`Banco "${file.name}": ${insertError.message}`);
        } else {
          successCount++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Unexpected error:", err);
      errors.push(`Erro inesperado: ${msg}`);
    }

    setUploading(false);
    if (successCount > 0) {
      setMessage({
        type: "success",
        text: `${successCount} documento(s) importado(s) com sucesso!`,
      });
      loadRecentDocs();
    } else {
      setMessage({ type: "error", text: errors.length > 0 ? errors.join(" | ") : "Falha ao importar documentos." });
    }
  }, []);

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
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/30",
      consulted: "bg-cyan-primary/10 text-cyan-primary border-cyan-primary/30",
      used: "bg-success/10 text-success border-success/30",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      consulted: "Consultado",
      used: "Usado",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? "border-cyan-primary bg-cyan-primary/5"
            : "border-surface-border hover:border-gray-600"
        }`}
      >
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-gray-400 mb-2">
          Arraste e solte documentos aqui
        </p>
        <p className="text-gray-600 text-sm mb-4">
          Aceita imagens (JPG, PNG) e PDFs
        </p>
        <label className="inline-block px-6 py-2.5 bg-cyan-primary text-black font-semibold rounded-lg cursor-pointer hover:bg-cyan-dark transition-colors text-sm">
          {uploading ? "Enviando..." : "Selecionar Arquivos"}
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

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-success/10 text-success border border-success/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Recent imports table */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-white">Importações Recentes</h2>
        </div>
        {recentDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Nenhum documento importado ainda.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-300 truncate max-w-xs">
                    {doc.file_name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {statusBadge(doc.status)}
                  <span className="text-xs text-gray-600">
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
