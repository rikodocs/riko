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

// Validate CPF using the official check digit algorithm
function isValidCPFChecksum(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // All same digits = invalid
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

// Fix common OCR character misreads in digit contexts
function fixOCRDigits(text: string): string {
  return text
    // O/o → 0 when near digits
    .replace(/(\d)[oO](\d)/g, "$10$2")
    .replace(/[oO](\d{2})/g, "0$1")
    .replace(/(\d{2})[oO]/g, "$10")
    // l/I/| → 1 when near digits
    .replace(/(\d)[lI|](\d)/g, "$11$2")
    .replace(/[lI|](\d{2})/g, "1$1")
    .replace(/(\d{2})[lI|]/g, "$11")
    // S/s → 5 when between digits
    .replace(/(\d)[Ss](\d)/g, "$15$2")
    // Z/z → 2 when between digits
    .replace(/(\d)[Zz](\d)/g, "$12$2")
    // B → 8 when between digits
    .replace(/(\d)B(\d)/g, "$18$2")
    // G → 6 when between digits
    .replace(/(\d)G(\d)/g, "$16$2")
    // q → 9 when between digits
    .replace(/(\d)q(\d)/g, "$19$2")
    // D → 0 when between digits
    .replace(/(\d)D(\d)/g, "$10$2");
}

// Extract CPF from text - comprehensive approach with validation
function extractCPF(text: string): string | null {
  // Step 1: Normalize and fix OCR errors
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[""'']/g, "")  // remove smart quotes
    .replace(/\u00A0/g, " "); // non-breaking space → regular space

  // Try with original text and OCR-fixed version
  const variants = [cleaned, fixOCRDigits(cleaned)];

  for (const variant of variants) {
    // Step 2: Try structured patterns (most reliable first)
    const patterns = [
      // Standard format: 000.000.000-00
      /\d{3}\.\d{3}\.\d{3}[-–—\/]\d{2}/g,
      // With spaces around separators: 000 . 000 . 000 - 00
      /\d{3}\s*[.,]\s*\d{3}\s*[.,]\s*\d{3}\s*[-–—\/]\s*\d{2}/g,
      // No dots but with dash: 000000000-00
      /\d{9}[-–—\/]\d{2}/g,
      // Near "CPF" keyword - very aggressive capture
      /(?:CPF|C\.?P\.?F\.?|cpf)\s*[:\-=]?\s*[nN°º]?\s*(\d[\d.\-–\/\s]{9,18}\d)/gi,
      // Near "4d CPF" or similar field labels in CNH
      /(?:4[d4]|CPF)\s*(\d{3}\s*[.,]?\s*\d{3}\s*[.,]?\s*\d{3}\s*[-–]?\s*\d{2})/gi,
      // 11 consecutive digits (least reliable)
      /\d{11}/g,
    ];

    for (const pattern of patterns) {
      const matches = [...variant.matchAll(pattern)];
      for (const match of matches) {
        const raw = match[1] || match[0];
        const cpf = raw.replace(/\D/g, "");
        if (cpf.length === 11 && isValidCPFChecksum(cpf)) {
          return cpf;
        }
      }
    }

    // Step 3: Context search - find "CPF" label and scan nearby text
    const lines = variant.split(/\n/);
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (/CPF|C\.?P\.?F/i.test(line)) {
        // Search this line and next 2 lines for any digit sequence
        const searchBlock = lines.slice(li, li + 3).join(" ");
        const digitGroups = searchBlock.match(/\d[\d.\-–\/\s]{9,18}\d/g) || [];
        for (const group of digitGroups) {
          const cpf = group.replace(/\D/g, "");
          if (cpf.length === 11 && isValidCPFChecksum(cpf)) {
            return cpf;
          }
        }
      }
    }
  }

  // Step 4: Last resort - find ANY 11-digit sequence that passes checksum
  // even without OCR fixes, scanning all digit groups
  const allDigitRuns = text.replace(/[^0-9]/g, " ").split(/\s+/).filter(Boolean);
  // Also try sliding window over long digit runs
  const longRun = text.replace(/[^0-9]/g, "");
  for (let i = 0; i <= longRun.length - 11; i++) {
    const candidate = longRun.substring(i, i + 11);
    if (isValidCPFChecksum(candidate)) {
      return candidate;
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
      const pending = docs.filter((d) => d.status === "pending").length;
      const consulted = docs.filter((d) => d.status === "consulted").length;
      const used = docs.filter((d) => d.status === "used").length;
      const manual_review = docs.filter((d) => d.status === "manual_review").length;
      setStats({
        pending,
        consulted,
        used,
        manual_review,
        total: pending + consulted + used + manual_review,
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
            // OCR on image with pre-processing for better accuracy
            addLog(`[INFO] Executando OCR na imagem...`);
            const imageUrl = URL.createObjectURL(fileData);

            // Pre-process: load image to canvas, convert to grayscale + high contrast
            const enhancedUrl = await new Promise<string>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                // Scale up small images for better OCR
                const scale = Math.max(1, Math.min(3, 2000 / Math.max(img.width, img.height)));
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Grayscale + contrast boost
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let p = 0; p < data.length; p += 4) {
                  // Grayscale
                  const gray = data[p] * 0.299 + data[p+1] * 0.587 + data[p+2] * 0.114;
                  // Contrast boost (1.5x) + threshold sharpening
                  const contrast = ((gray / 255 - 0.5) * 1.8 + 0.5) * 255;
                  const val = Math.max(0, Math.min(255, contrast));
                  // Binarize: push to black or white for cleaner OCR
                  const bin = val > 140 ? 255 : 0;
                  data[p] = bin;
                  data[p+1] = bin;
                  data[p+2] = bin;
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
              };
              img.onerror = () => resolve(imageUrl); // fallback to original
              img.src = imageUrl;
            });

            // Run OCR on enhanced image
            const { data: ocrData } = await Tesseract.recognize(enhancedUrl, "por");
            extractedText = ocrData.text;
            addLog(`[INFO] OCR concluído: ${doc.file_name}`);

            // If no CPF found, also try original (non-enhanced) image
            if (!extractCPF(extractedText)) {
              addLog(`[INFO] Tentando OCR na imagem original...`);
              const { data: ocrData2 } = await Tesseract.recognize(imageUrl, "por");
              extractedText += "\n" + ocrData2.text;
            }

            URL.revokeObjectURL(imageUrl);
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
              const items = textContent.items as any[];

              // Smart text joining: group by Y position (lines), then sort by X
              const lines: { y: number; items: { x: number; str: string }[] }[] = [];
              for (const item of items) {
                if (!item.str) continue;
                const y = Math.round(item.transform?.[5] || 0);
                const x = item.transform?.[4] || 0;
                let line = lines.find((l) => Math.abs(l.y - y) < 5);
                if (!line) {
                  line = { y, items: [] };
                  lines.push(line);
                }
                line.items.push({ x, str: item.str });
              }
              // Sort lines top-to-bottom, items left-to-right
              lines.sort((a, b) => b.y - a.y);
              const pageText = lines
                .map((l) => l.items.sort((a, b) => a.x - b.x).map((it) => it.str).join(" "))
                .join("\n");

              extractedText += "\n" + pageText;

              // Also keep a version with all items joined without separator (catches split digits)
              const rawJoin = items.map((it: { str?: string }) => it.str || "").join("");
              extractedText += "\n" + rawJoin;

              addLog(`[INFO] Texto página ${i}: ${pageText.substring(0, 120)}...`);
            }

            // Check if we found CPF in the digital text
            if (extractCPF(extractedText)) {
              addLog(`[OK] CPF encontrado no texto digital do PDF!`);
            } else {
              // Step 2: Fallback to OCR if no CPF found in text
              addLog(`[INFO] Texto digital não contém CPF. Usando OCR...`);
              const ocrTexts: string[] = [];
              for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 3.0 }); // Higher res for better OCR
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await page.render({ canvasContext: ctx, viewport } as any).promise;

                // Apply grayscale + binarization for cleaner OCR
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const px = imageData.data;
                for (let p = 0; p < px.length; p += 4) {
                  const gray = px[p] * 0.299 + px[p+1] * 0.587 + px[p+2] * 0.114;
                  const val = gray > 140 ? 255 : 0;
                  px[p] = val; px[p+1] = val; px[p+2] = val;
                }
                ctx.putImageData(imageData, 0, 0);

                const imageUrl = canvas.toDataURL("image/png");
                const { data: ocrData } = await Tesseract.recognize(imageUrl, "por");
                ocrTexts.push(ocrData.text);
                addLog(`[INFO] OCR página ${i}/${numPages} concluído`);

                // Check if CPF found so far in OCR results
                if (extractCPF(ocrTexts.join("\n"))) break;
              }
              // Append OCR text to extracted text (keep digital text too)
              extractedText += "\n" + ocrTexts.join("\n");
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
