"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

interface ReviewDoc {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
  extracted_text: string | null;
  created_at: string;
}

function formatCPFInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return true;
}

const PER_PAGE = 20;

export default function RevisaoPage() {
  const [docs, setDocs] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [cpfInputs, setCpfInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const [previewDoc, setPreviewDoc] = useState<ReviewDoc | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, file_url, file_path, file_type, extracted_text, created_at")
      .eq("status", "manual_review")
      .order("created_at", { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  }

  const totalPages = Math.max(1, Math.ceil(docs.length / PER_PAGE));
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return docs.slice(start, start + PER_PAGE);
  }, [docs, currentPage]);

  // When docs change (e.g. after discard/consult), adjust page if needed
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [docs.length, totalPages, currentPage]);

  async function handleSubmitCPF(doc: ReviewDoc) {
    const cpfRaw = cpfInputs[doc.id]?.replace(/\D/g, "") || "";
    if (!isValidCPF(cpfRaw)) {
      setMessages((prev) => ({ ...prev, [doc.id]: { type: "error", text: "CPF inválido. Deve ter 11 dígitos." } }));
      return;
    }

    setSubmitting((prev) => ({ ...prev, [doc.id]: true }));
    setMessages((prev) => ({ ...prev, [doc.id]: undefined as unknown as { type: "success" | "error"; text: string } }));

    try {
      const res = await fetch("/api/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: [{ docId: doc.id, cpf: cpfRaw }] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => ({ ...prev, [doc.id]: { type: "error", text: data.error || "Erro na consulta" } }));
      } else {
        const isDuplicate = data.duplicates?.length > 0;
        if (isDuplicate) {
          const detail = data.notifications?.[0] || "CPF já existe no sistema.";
          setMessages((prev) => ({
            ...prev,
            [doc.id]: { type: "error", text: detail },
          }));
          setTimeout(() => {
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
          }, 3000);
        } else {
          setMessages((prev) => ({
            ...prev,
            [doc.id]: { type: "success", text: "Consultado com sucesso!" },
          }));
          setTimeout(() => {
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
          }, 1500);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => ({ ...prev, [doc.id]: { type: "error", text: msg } }));
    }

    setSubmitting((prev) => ({ ...prev, [doc.id]: false }));
  }

  async function handleDiscard(docId: string) {
    await supabase.from("documents").update({ status: "error" }).eq("id", docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-tertiary text-xs mt-0.5">
            Documentos onde o CPF não foi identificado automaticamente. Visualize e informe o CPF manualmente.
          </p>
        </div>
        <span className="text-[11px] text-text-disabled font-mono shrink-0">
          {docs.length} doc(s)
        </span>
      </div>

      {/* Pagination top */}
      {docs.length > PER_PAGE && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          total={docs.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Full-screen preview modal */}
      {previewDoc && typeof document !== "undefined" && createPortal(
        <div
          id="preview-modal-root"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 2147483647,
            background: "#000",
          }}
        >
          <button
            onClick={() => setPreviewDoc(null)}
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 2147483647,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 2147483647,
              background: "rgba(0,0,0,0.8)",
              borderRadius: 8,
              padding: "8px 14px",
              maxWidth: "calc(100vw - 100px)",
            }}
          >
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {previewDoc.file_name}
            </p>
          </div>
          {previewDoc.file_type?.startsWith("image/") ? (
            <div
              style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 16px 16px",
                boxSizing: "border-box",
                overflow: "auto",
              }}
            >
              <img
                src={previewDoc.file_url}
                alt={previewDoc.file_name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 80px)",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <iframe
              src={`${previewDoc.file_url}#toolbar=1&navpanes=0&view=FitH`}
              title={previewDoc.file_name}
              style={{
                position: "absolute",
                top: 56,
                left: 0,
                width: "100vw",
                height: "calc(100vh - 56px)",
                border: "none",
                background: "#fff",
              }}
            />
          )}
        </div>,
        document.body
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-static rounded-2xl p-5 animate-shimmer h-48" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="glass-static rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-success-muted mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-tertiary text-sm">Nenhum documento aguardando revisão manual.</p>
          <p className="text-text-disabled text-xs mt-1">Todos os CPFs foram identificados automaticamente!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedDocs.map((doc, i) => {
            const ext = doc.file_name?.split(".").pop()?.toLowerCase() || "";
            const isPdf = doc.file_type === "application/pdf" || ext === "pdf";
            const isImage = doc.file_type?.startsWith("image/");
            const cpfValue = cpfInputs[doc.id] || "";
            const isSubmitting = submitting[doc.id] || false;
            const message = messages[doc.id];

            return (
              <div
                key={doc.id}
                className="glass-static rounded-2xl overflow-hidden stagger-item"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Document preview */}
                  <div
                    className="lg:w-[320px] h-[280px] lg:h-auto bg-glass overflow-hidden cursor-pointer relative group shrink-0"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    {isImage ? (
                      <img
                        src={doc.file_url}
                        alt={doc.file_name}
                        className="w-full h-full object-contain bg-surface-0"
                      />
                    ) : isPdf ? (
                      <iframe
                        src={`${doc.file_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={doc.file_name}
                        className="w-full h-full border-0 pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 text-white text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Ampliar
                      </div>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className="text-text-primary font-medium text-[13px] truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-text-disabled text-[11px] font-mono mt-0.5">
                            Importado em {new Date(doc.created_at).toLocaleDateString("pt-BR")} às{" "}
                            {new Date(doc.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="badge badge-danger shrink-0">Sem CPF</span>
                      </div>

                      {doc.extracted_text && (
                        <details className="mb-4">
                          <summary className="text-[11px] text-text-disabled cursor-pointer hover:text-text-tertiary transition-colors">
                            Texto extraído pelo OCR
                          </summary>
                          <pre className="mt-2 bg-surface-0 rounded-xl border border-surface-border p-3 text-[10px] text-text-tertiary overflow-auto max-h-32 font-mono whitespace-pre-wrap">
                            {doc.extracted_text}
                          </pre>
                        </details>
                      )}

                      <div className="space-y-3">
                        <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
                          Informe o CPF do documento
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={cpfValue}
                              onChange={(e) => {
                                const formatted = formatCPFInput(e.target.value);
                                setCpfInputs((prev) => ({ ...prev, [doc.id]: formatted }));
                                if (messages[doc.id]?.type === "error") {
                                  setMessages((prev) => {
                                    const copy = { ...prev };
                                    delete copy[doc.id];
                                    return copy;
                                  });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isSubmitting) {
                                  handleSubmitCPF(doc);
                                }
                              }}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              className="input-base w-full font-mono text-[15px] tracking-wider !py-3"
                              disabled={isSubmitting}
                            />
                          </div>
                          <button
                            onClick={() => handleSubmitCPF(doc)}
                            disabled={isSubmitting || cpfValue.replace(/\D/g, "").length < 11}
                            className="btn-primary !py-3 !px-6 whitespace-nowrap"
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Consultar
                              </>
                            )}
                          </button>
                        </div>

                        {message && (
                          <div
                            className={`px-3 py-2 rounded-lg text-[11px] font-medium animate-fade-in ${
                              message.type === "success"
                                ? "bg-success-muted text-success border border-success/20"
                                : "bg-danger-muted text-danger border border-danger/20"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-border flex justify-end">
                      <button
                        onClick={() => handleDiscard(doc.id)}
                        className="btn-ghost !text-[11px] !py-1.5 !px-3 text-text-disabled hover:!text-danger hover:!bg-danger-muted"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination bottom */}
      {docs.length > PER_PAGE && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          total={docs.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

// Reusable pagination component
function PaginationBar({
  currentPage,
  totalPages,
  total,
  perPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, total);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="glass-static rounded-2xl px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
      <span className="text-text-disabled text-[12px] font-mono">
        {start}-{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-glass-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-text-disabled text-[12px]">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-medium transition-colors ${
                p === currentPage
                  ? "bg-primary text-white"
                  : "text-text-tertiary hover:bg-glass-hover hover:text-text-primary"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-glass-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
