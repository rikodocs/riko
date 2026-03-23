"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Tesseract from "tesseract.js";

interface Stats {
  pending: number;
  consulted: number;
  used: number;
  manual_review: number;
  total: number;
}

interface PendingDoc {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
}

// Extract CPF from text - tries multiple patterns and formats
function extractCPF(text: string): string | null {
  // Normalize text: remove extra spaces, fix common OCR mistakes
  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/[oO]/g, (m, offset, str) => {
      // Replace O with 0 only when surrounded by digits
      const before = str[offset - 1];
      const after = str[offset + 1];
      if (before && after && /\d/.test(before) && /\d/.test(after)) return "0";
      return m;
    });

  const patterns = [
    // Standard format: 000.000.000-00
    /\d{3}\.\d{3}\.\d{3}[-–]\d{2}/g,
    // With spaces: 000 . 000 . 000 - 00
    /\d{3}\s*\.\s*\d{3}\s*\.\s*\d{3}\s*[-–]\s*\d{2}/g,
    // Just digits near "CPF" keyword
    /(?:CPF|cpf|C\.?P\.?F\.?)\s*[:\-]?\s*(\d[\d.\-\s]{10,16}\d)/gi,
    // 11 consecutive digits
    /\d{11}/g,
  ];

  for (const pattern of patterns) {
    const matches = normalized.matchAll(pattern);
    for (const match of matches) {
      // Use captured group if exists, otherwise full match
      const raw = match[1] || match[0];
      const cpf = raw.replace(/\D/g, "");
      if (cpf.length === 11 && !/^(\d)\1{10}$/.test(cpf)) {
        return cpf;
      }
    }
  }
  return null;
}

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ pending: 0, consulted: 0, used: 0, manual_review: 0, total: 0 });
  const [consulting, setConsulting] = useState(false);
  const [consultLog, setConsultLog] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const addLog = (msg: string) => {
    logRef.current = [...logRef.current, msg];
    setConsultLog([...logRef.current]);
  };

  async function loadStats() {
    const { data: docs } = await supabase.from("documents").select("status");
    if (docs) {
      setStats({
        pending: docs.filter((d) => d.status === "pending").length,
        consulted: docs.filter((d) => d.status === "consulted").length,
        used: docs.filter((d) => d.status === "used").length,
        manual_review: docs.filter((d) => d.status === "manual_review").length,
        total: docs.length,
      });
    }
  }

  async function handleConsultar() {
    setConsulting(true);
    logRef.current = [];
    setConsultLog([]);
    setNotifications([]);

    try {
      // 1. Get pending documents
      const { data: pendingDocs, error: docsError } = await supabase
        .from("documents")
        .select("id, file_name, file_url, file_path, file_type")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (docsError) {
        addLog(`[ERRO] Falha ao buscar documentos: ${docsError.message}`);
        setConsulting(false);
        return;
      }

      if (!pendingDocs || pendingDocs.length === 0) {
        addLog("[INFO] Nenhum documento pendente encontrado.");
        setConsulting(false);
        return;
      }

      addLog(`[INFO] Processando ${pendingDocs.length} documento(s) pendente(s)...`);

      // 2. OCR each document in the browser
      const extracted: { docId: string; cpf: string }[] = [];

      for (const doc of pendingDocs as PendingDoc[]) {
        addLog(`[INFO] Lendo documento: ${doc.file_name}`);

        try {
          // Download from Supabase Storage
          const { data: fileData, error: dlError } = await supabase.storage
            .from("documents")
            .download(doc.file_path);

          if (dlError || !fileData) {
            addLog(`[ERRO] Falha ao baixar: ${doc.file_name} - ${dlError?.message || "sem dados"}`);
            continue;
          }

          let extractedText = "";

          if (doc.file_type?.startsWith("image/")) {
            // OCR on image - runs in the browser
            addLog(`[INFO] Executando OCR na imagem...`);
            const imageUrl = URL.createObjectURL(fileData);
            const { data: ocrData } = await Tesseract.recognize(imageUrl, "por");
            extractedText = ocrData.text;
            URL.revokeObjectURL(imageUrl);
            addLog(`[INFO] OCR concluído: ${doc.file_name}`);
          } else if (doc.file_type === "application/pdf") {
            addLog(`[INFO] Processando PDF...`);
            const arrayBuffer = await fileData.arrayBuffer();
            const pdfjsLib = await import("pdfjs-dist");
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
              const workerBlob = new Blob(
                [await (await fetch("/pdf.worker.min.mjs")).text()],
                { type: "application/javascript" }
              );
              pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
            }

            const pdf = await pdfjsLib.getDocument({
              data: arrayBuffer,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any).promise;
            const numPages = Math.min(pdf.numPages, 5);

            // Step 1: Try to extract selectable text from PDF (fast, no OCR needed)
            addLog(`[INFO] Tentando extrair texto digital do PDF...`);
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pageText = textContent.items.map((item: any) => item.str || "").join(" ");
              extractedText += " " + pageText;
              addLog(`[INFO] Texto página ${i}: ${pageText.substring(0, 100)}...`);
            }

            // Check if we found CPF in the digital text
            if (extractCPF(extractedText)) {
              addLog(`[OK] CPF encontrado no texto digital do PDF!`);
            } else {
              // Step 2: Fallback to OCR if no CPF found in text
              addLog(`[INFO] Texto digital não contém CPF. Usando OCR...`);
              extractedText = "";
              for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 3.0 }); // Higher res for better OCR
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport } as any).promise;

                const imageUrl = canvas.toDataURL("image/png");
                const { data: ocrData } = await Tesseract.recognize(imageUrl, "por");
                extractedText += " " + ocrData.text;
                addLog(`[INFO] OCR página ${i}/${numPages} concluído`);

                if (extractCPF(extractedText)) break;
              }
            }
          }

          // Try to extract CPF
          const cpf = extractCPF(extractedText);

          if (cpf) {
            addLog(`[OK] CPF encontrado: ${formatCPF(cpf)} em ${doc.file_name}`);
            extracted.push({ docId: doc.id, cpf });
          } else {
            addLog(`[AVISO] CPF não encontrado em: ${doc.file_name} → Enviado para revisão manual`);
            // Mark as manual_review so user can manually input CPF
            await supabase
              .from("documents")
              .update({ status: "manual_review", extracted_text: extractedText.substring(0, 500) })
              .eq("id", doc.id);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog(`[ERRO] Falha no OCR de ${doc.file_name}: ${msg}`);
        }
      }

      // 3. Send extracted CPFs to server for API consultation
      if (extracted.length > 0) {
        addLog(`\n[INFO] Enviando ${extracted.length} CPF(s) para consulta na API...`);

        const res = await fetch("/api/consultar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents: extracted }),
        });

        const data = await res.json();

        if (!res.ok) {
          addLog(`[ERRO] ${data.error}`);
        } else {
          if (data.log) {
            data.log.forEach((line: string) => addLog(line));
          }
          if (data.notifications?.length > 0) {
            setNotifications(data.notifications);
          }
        }
      } else {
        addLog("[AVISO] Nenhum CPF foi extraído dos documentos.");
      }

      await loadStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`[ERRO] Erro inesperado: ${msg}`);
    }

    setConsulting(false);
  }

  const statCards = [
    { label: "Pendentes", value: stats.pending, color: "text-warning", bg: "bg-warning-muted" },
    { label: "Revisão Manual", value: stats.manual_review, color: "text-danger", bg: "bg-danger-muted" },
    { label: "Consultados", value: stats.consulted, color: "text-primary", bg: "bg-primary-muted" },
    { label: "Usados", value: stats.used, color: "text-success", bg: "bg-success-muted" },
    { label: "Total", value: stats.total, color: "text-text-primary", bg: "bg-glass" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid - Bento style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`glass-static rounded-2xl p-5 stagger-item`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-text-tertiary text-[11px] uppercase tracking-[0.1em] font-medium mb-2"
               style={{ fontFamily: "var(--font-heading)" }}>
              {card.label}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${card.color}`}
               style={{ fontFamily: "var(--font-heading)" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Consultar Section */}
      <div className="glass-static rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-heading)" }}>
              Consultar Documentos
            </h2>
            <p className="text-text-tertiary text-xs mt-0.5">
              Processa documentos pendentes: extrai CPF via OCR e consulta na API
            </p>
          </div>
          <button
            onClick={handleConsultar}
            disabled={consulting || stats.pending === 0}
            className="btn-primary whitespace-nowrap"
          >
            {consulting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Consultar ({stats.pending})
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {notifications.map((note, i) => (
              <div
                key={i}
                className="bg-warning-muted border border-warning/20 text-warning px-4 py-2.5 rounded-xl text-xs font-medium animate-fade-in"
              >
                {note}
              </div>
            ))}
          </div>
        )}

        {/* Console Log */}
        {consultLog.length > 0 && (
          <div className="bg-surface-0 rounded-xl border border-surface-border p-4 max-h-80 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5">
            {consultLog.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.startsWith("Erro") || line.startsWith("[ERRO")
                    ? "text-danger"
                    : line.startsWith("[OK")
                    ? "text-success"
                    : line.startsWith("[AVISO") || line.startsWith("[DUPLICADO")
                    ? "text-warning"
                    : "text-text-tertiary"
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
