"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCPFInput, isValidCPF } from "@/lib/cpf";

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

export default function DocumentCard({ doc, viewerId, viewerName, onDone }: DocumentCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cpf, setCpf] = useState("");
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cpfCheckIdRef = useRef(0);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    setCpf("");
    setDuplicate(false);
    setError(null);
    setLoadError(null);
    let cancelled = false;
    renderDocument(() => cancelled);
    return () => {
      cancelled = true;
      // Stop pdf.js from continuing to paint into the (possibly reused or
      // resized) canvas after this effect has been superseded — checking
      // `cancelled` after an await only skips our own code, it doesn't stop
      // paint calls the RenderTask already has in flight.
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

  async function renderDocument(isCancelled: () => boolean) {
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

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      if (isCancelled()) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderTask = page.render({ canvasContext: ctx, viewport } as any);
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (err) {
        // pdf.js throws a RenderingCancelledException when .cancel() is
        // called from the effect cleanup — that's expected, not a real error.
        if (isCancelled()) return;
        // A genuine render failure (bad PDF, decode error). renderDocument
        // is invoked as a bare async call from the effect, so rethrowing
        // here would just become an unhandled promise rejection — surface
        // it the same way the other error paths in this component do.
        setLoadError("Não foi possível carregar o documento.");
        return;
      }
      renderTaskRef.current = null;
      if (isCancelled()) return;
      drawWatermark(ctx, canvas.width, canvas.height);
    } else {
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

  async function handleCpfChange(value: string) {
    const formatted = formatCPFInput(value);
    setCpf(formatted);
    setDuplicate(false);
    setError(null);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11 && isValidCPF(formatted)) {
      const checkId = ++cpfCheckIdRef.current;
      setCheckingDuplicate(true);
      const { data, error: queryError } = await supabase
        .from("people")
        .select("id")
        .eq("cpf", digits)
        .single();
      // Ignore this response if the CPF field has moved on since this check
      // was issued (a newer keystroke superseded it).
      if (checkId !== cpfCheckIdRef.current) return;
      setCheckingDuplicate(false);
      // PGRST116 = "no rows returned", which is the expected/normal result
      // of .single() when the CPF isn't registered yet — not a failure.
      if (queryError && queryError.code !== "PGRST116") {
        // A real query failure (network/DB error) — leave duplicate state
        // as-is rather than confidently asserting "not duplicate". The
        // server re-validates authoritatively on submit either way.
        return;
      }
      setDuplicate(!!data);
    }
  }

  const digits = cpf.replace(/\D/g, "");
  const cpfComplete = digits.length === 11 && isValidCPF(cpf);
  const canAccept = cpfComplete && !duplicate && !checkingDuplicate;

  async function handleAccept() {
    if (!canAccept) return;
    setSubmitting("accept");
    setError(null);
    const res = await fetch("/api/viewer/aceitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id, cpf: digits }),
    });
    const responseBody = await res.json();
    setSubmitting(null);
    if (!res.ok) {
      if (responseBody.duplicate) setDuplicate(true);
      setError(responseBody.error || "Erro ao confirmar.");
      return;
    }
    onDone();
  }

  async function handleReject() {
    setSubmitting("reject");
    setError(null);
    const res = await fetch("/api/viewer/recusar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id }),
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

      <div className="flex flex-col gap-2">
        <label className="text-text-secondary text-xs uppercase tracking-[0.15em] font-medium">
          CPF visível no documento
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          placeholder="000.000.000-00"
          className="input-base mono-input w-full"
          disabled={submitting !== null}
        />
        {duplicate && <p className="text-danger text-xs font-medium">CPF já cadastrado no sistema.</p>}
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
          onClick={handleAccept}
          disabled={!canAccept || submitting !== null}
          className="flex-1 py-3 rounded-md bg-primary text-on-primary font-semibold disabled:opacity-40"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
