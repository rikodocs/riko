"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCPFInput, isValidCPF } from "@/lib/cpf";
import type { PersonFields } from "@/lib/consulta";

interface DocumentCardDoc {
  id: string;
  file_type: string | null;
}

interface DocumentCardProps {
  doc: DocumentCardDoc;
  viewerId: string;
  viewerName: string;
  onDone: () => void;
}

interface CpfRowState {
  value: string;
  duplicate: boolean;
  checking: boolean;
}

interface PreviewEntry {
  cpf: string;
  ok: boolean;
  duplicate: boolean;
  message: string;
  fields: PersonFields | null;
}

const MAX_CPF_ROWS = 6;

function emptyRow(): CpfRowState {
  return { value: "", duplicate: false, checking: false };
}

function formatCpfDisplay(digits: string): string {
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function DocumentCard({ doc, viewerId, viewerName, onDone }: DocumentCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rows, setRows] = useState<CpfRowState[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState<"preview" | "save" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [previewResults, setPreviewResults] = useState<PreviewEntry[] | null>(null);
  // Guarda o raw_data que veio da prévia pra reenviar na confirmação, sem
  // precisar consultar a API de novo (nem expor isso na tela).
  const rawDataByCpfRef = useRef<Record<string, unknown>>({});

  const cpfCheckIdRef = useRef<number[]>([]);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const renderTokenRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const fileBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    setRows([emptyRow()]);
    cpfCheckIdRef.current = [];
    setError(null);
    setLoadError(null);
    setPageNum(1);
    setNumPages(1);
    setConfirmed(false);
    setPreviewResults(null);
    rawDataByCpfRef.current = {};
    pdfDocRef.current = null;
    fileBlobRef.current = null;
    loadDocument();
    return () => {
      // Invalidate any in-flight async work from this doc.id (loadDocument,
      // renderPdfPage) and stop pdf.js from continuing to paint into the
      // (possibly reused or resized) canvas.
      renderTokenRef.current++;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
    // viewerId/viewerName are stable for the component's lifetime (a viewer
    // session doesn't rename itself mid-review), so re-running only on
    // doc.id is intentional, not an oversight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const label = `${viewerName} · ${new Date().toLocaleString("pt-BR")}`;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(14, Math.floor(width / 40))}px sans-serif`;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = 260;
    const stepY = 120;
    for (let y = -height; y < height; y += stepY) {
      for (let x = -width; x < width; x += stepX) {
        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();
  }

  async function loadDocument() {
    const token = ++renderTokenRef.current;
    const isCancelled = () => token !== renderTokenRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const res = await fetch(`/api/documento/${doc.id}?viewerId=${viewerId}`);
    if (isCancelled()) return;
    if (!res.ok) {
      setLoadError("Não foi possível carregar o documento.");
      return;
    }
    const blob = await res.blob();
    if (isCancelled()) return;
    fileBlobRef.current = blob;

    if (doc.file_type === "application/pdf") {
      const arrayBuffer = await blob.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      if (isCancelled()) return;
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const workerBlob = new Blob(
          [await (await fetch("/pdf.worker.min.mjs")).text()],
          { type: "application/javascript" }
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
      }
      if (isCancelled()) return;

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).promise;
      if (isCancelled()) return;

      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      await renderPdfPage(1, isCancelled);
    } else {
      setNumPages(1);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        if (isCancelled()) {
          URL.revokeObjectURL(url);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        drawWatermark(ctx, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (isCancelled()) return;
        setLoadError("Não foi possível carregar o documento.");
      };
      img.src = url;
    }
  }

  async function renderPdfPage(pageNumber: number, isCancelled: () => boolean) {
    const canvas = canvasRef.current;
    const pdf = pdfDocRef.current;
    if (!canvas || !pdf) return;

    const page = await pdf.getPage(pageNumber);
    if (isCancelled()) return;
    // Escala alta o bastante pra dar pra dar zoom na página (Ctrl + / pinça)
    // e continuar legível — em telas de alta densidade (celular) usa mais
    // pixels ainda.
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scale = 2.5 * Math.min(dpr, 2);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTask = page.render({ canvasContext: ctx, viewport } as any);
    renderTaskRef.current = renderTask;
    try {
      await renderTask.promise;
    } catch (err) {
      // pdf.js throws a RenderingCancelledException when .cancel() is called
      // — that's expected, not a real error.
      if (isCancelled()) return;
      setLoadError("Não foi possível carregar a página do documento.");
      return;
    }
    renderTaskRef.current = null;
    if (isCancelled()) return;
    drawWatermark(ctx, canvas.width, canvas.height);
  }

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > numPages || !pdfDocRef.current) return;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;
    const token = ++renderTokenRef.current;
    setPageNum(nextPage);
    await renderPdfPage(nextPage, () => token !== renderTokenRef.current);
  }

  function updateRow(index: number, patch: Partial<CpfRowState>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleCpfChange(index: number, value: string) {
    const formatted = formatCPFInput(value);
    updateRow(index, { value: formatted, duplicate: false });
    setError(null);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11 && isValidCPF(formatted)) {
      cpfCheckIdRef.current[index] = (cpfCheckIdRef.current[index] || 0) + 1;
      const checkId = cpfCheckIdRef.current[index];
      updateRow(index, { checking: true });
      const { data, error: queryError } = await supabase
        .from("people")
        .select("id")
        .eq("cpf", digits)
        .single();
      // Ignore this response if the row moved on since this check was issued.
      if (checkId !== cpfCheckIdRef.current[index]) return;
      updateRow(index, { checking: false });
      // PGRST116 = "no rows returned", the expected/normal result when the
      // CPF isn't registered yet — not a failure.
      if (queryError && queryError.code !== "PGRST116") {
        return;
      }
      updateRow(index, { duplicate: !!data });
    }
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_CPF_ROWS ? prev : [...prev, emptyRow()]));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    cpfCheckIdRef.current.splice(index, 1);
  }

  const validRows = rows.filter((r) => r.value.replace(/\D/g, "").length > 0);
  const allValidRowsOk = validRows.every(
    (r) => r.value.replace(/\D/g, "").length === 11 && isValidCPF(r.value) && !r.duplicate && !r.checking
  );
  const canAccept = validRows.length > 0 && allValidRowsOk;

  // Passo 1: busca os dados na API (sem gravar nada ainda) e mostra pra
  // conferir se é mesmo a pessoa certa antes de salvar.
  async function handlePreview() {
    if (!canAccept) return;
    setSubmitting("preview");
    setError(null);
    const cpfs = validRows.map((r) => r.value.replace(/\D/g, ""));
    const res = await fetch("/api/viewer/consultar-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id, cpfs }),
    });
    const responseBody = await res.json();
    setSubmitting(null);
    if (!res.ok) {
      setError(responseBody.error || "Erro ao consultar.");
      return;
    }
    const results = (responseBody.results || []) as Array<{
      cpf: string;
      ok: boolean;
      duplicate: boolean;
      message: string;
      fields: PersonFields | null;
      rawData: unknown;
    }>;
    for (const r of results) {
      rawDataByCpfRef.current[r.cpf] = r.rawData;
    }
    setPreviewResults(
      results.map((r) => ({ cpf: r.cpf, ok: r.ok, duplicate: r.duplicate, message: r.message, fields: r.fields }))
    );
  }

  function handleBackToEdit() {
    setPreviewResults(null);
    rawDataByCpfRef.current = {};
    setError(null);
  }

  // Passo 2: só agora grava de fato — o viewer já viu os dados e confirmou.
  async function handleConfirmSave() {
    if (!previewResults) return;
    const okEntries = previewResults.filter((r) => r.ok && r.fields);
    if (okEntries.length === 0) return;
    setSubmitting("save");
    setError(null);
    const entries = okEntries.map((r) => ({
      cpf: r.cpf,
      fields: r.fields as PersonFields,
      rawData: rawDataByCpfRef.current[r.cpf] ?? null,
    }));
    const res = await fetch("/api/viewer/aceitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id, entries }),
    });
    const responseBody = await res.json();
    setSubmitting(null);
    if (!res.ok) {
      setError(responseBody.error || "Erro ao confirmar.");
      return;
    }
    setConfirmed(true);
  }

  function handleDownloadAndContinue() {
    const blob = fileBlobRef.current;
    if (blob) {
      const ext =
        doc.file_type === "application/pdf" ? "pdf" : (doc.file_type || "").split("/")[1] || "bin";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento-${doc.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    onDone();
  }

  async function handleReject() {
    setSubmitting("reject");
    setError(null);
    // Se algum CPF digitado já estava cadastrado, é esse o motivo real da
    // recusa — prioriza ele em vez de outro CPF válido não-duplicado, pra
    // o histórico do admin mostrar "duplicado" em vez de genérico.
    const duplicateRow = rows.find((r) => r.duplicate);
    const reason = duplicateRow ? "duplicate" : undefined;
    const firstCpf = duplicateRow
      ? duplicateRow.value.replace(/\D/g, "")
      : rows.map((r) => r.value.replace(/\D/g, "")).find((digits) => digits.length === 11);
    const res = await fetch("/api/viewer/recusar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id, cpf: firstCpf, reason }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const responseBody = await res.json();
      setError(responseBody.error || "Erro ao recusar.");
      return;
    }
    onDone();
  }

  return (
    <div className="glass-static rounded-lg p-6 flex flex-col gap-6 max-w-xl w-full animate-fade-in-scale">
      <div
        className="relative rounded-md overflow-hidden bg-surface-1 border border-surface-border select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loadError ? (
          <p className="text-danger text-sm p-6 text-center">{loadError}</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-auto block pointer-events-none"
            draggable={false}
            aria-label="Documento para revisão, com marca d'água"
          />
        )}
      </div>

      {numPages > 1 && !loadError && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(pageNum - 1)}
            disabled={pageNum <= 1 || submitting !== null}
            className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-text-tertiary text-xs">
            Página {pageNum} de {numPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(pageNum + 1)}
            disabled={pageNum >= numPages || submitting !== null}
            className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}

      {confirmed ? (
        <button
          onClick={handleDownloadAndContinue}
          className="w-full py-3 rounded-md bg-primary text-on-primary font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Documento confirmado — Baixar e continuar
        </button>
      ) : previewResults ? (
        <>
          <div className="flex flex-col gap-3">
            <label className="text-text-secondary text-xs uppercase tracking-[0.15em] font-medium">
              Confira antes de salvar
            </label>

            {previewResults.map((r) => (
              <div
                key={r.cpf}
                className={`rounded-md border p-3 space-y-1 ${
                  r.ok ? "border-surface-border bg-surface-1" : "border-danger/40 bg-danger-muted"
                }`}
              >
                <p className="mono-input text-xs text-text-tertiary">{formatCpfDisplay(r.cpf)}</p>
                {r.ok && r.fields ? (
                  <>
                    <p className="text-text-primary text-sm font-semibold">{r.fields.name || "Nome não informado"}</p>
                    <p className="text-text-secondary text-xs">
                      {r.fields.birth_date ? `Nascimento: ${r.fields.birth_date}` : "Nascimento não informado"}
                    </p>
                    {r.fields.income && <p className="text-text-secondary text-xs">Renda: {r.fields.income}</p>}
                  </>
                ) : (
                  <p className="text-danger text-xs font-medium">{r.message}</p>
                )}
              </div>
            ))}

            {previewResults.every((r) => !r.ok) && (
              <p className="text-danger text-xs font-medium">
                Nenhum CPF pôde ser confirmado. Volte e corrija antes de tentar de novo.
              </p>
            )}

            {error && <p className="text-danger text-xs font-medium">{error}</p>}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBackToEdit}
              disabled={submitting !== null}
              className="flex-1 py-3 rounded-md border border-surface-border text-text-secondary font-semibold disabled:opacity-40"
            >
              Voltar e corrigir
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={submitting !== null || previewResults.every((r) => !r.ok)}
              className="flex-1 py-3 rounded-md bg-primary text-on-primary font-semibold disabled:opacity-40"
            >
              {submitting === "save" ? "Salvando..." : "Confirmar e salvar"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-text-secondary text-xs uppercase tracking-[0.15em] font-medium">
                CPF(s) visível(is) no documento
              </label>
              {numPages > 1 && (
                <span className="text-text-disabled text-[11px] text-right">
                  Documento com {numPages} páginas — confira se há mais de um CPF
                </span>
              )}
            </div>

            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={row.value}
                  onChange={(e) => handleCpfChange(index, e.target.value)}
                  placeholder="000.000.000-00"
                  className="input-base mono-input flex-1"
                  disabled={submitting !== null}
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={submitting !== null}
                    aria-label="Remover este CPF"
                    className="text-text-tertiary hover:text-danger transition-colors p-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {rows.some((r) => r.duplicate) && (
              <p className="text-danger text-xs font-medium">Um ou mais CPFs já cadastrados no sistema.</p>
            )}

            {rows.length < MAX_CPF_ROWS && (
              <button
                type="button"
                onClick={addRow}
                disabled={submitting !== null}
                className="btn-ghost text-xs self-start px-3 py-1.5"
              >
                + Adicionar outro CPF
              </button>
            )}

            {error && <p className="text-danger text-xs font-medium">{error}</p>}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReject}
              disabled={submitting !== null}
              className="flex-1 py-3 rounded-md bg-danger text-white font-semibold disabled:opacity-40"
            >
              Recusar
            </button>
            <button
              onClick={handlePreview}
              disabled={!canAccept || submitting !== null}
              className="flex-1 py-3 rounded-md bg-primary text-on-primary font-semibold disabled:opacity-40"
            >
              {submitting === "preview" ? "Consultando..." : "Aceitar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
