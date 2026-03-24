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

  // Step 4 (removed): Sliding window was too aggressive - it would concatenate
  // unrelated digit sequences (barcodes, registration numbers, etc.) and find
  // false CPF matches. Better to send to manual review than extract wrong CPF.

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
    // Count documents for pending and manual_review
    const { data: docs } = await supabase.from("documents").select("status");
    const pending = docs?.filter((d) => d.status === "pending").length || 0;
    const manual_review = docs?.filter((d) => d.status === "manual_review").length || 0;

    // Count PEOPLE (not documents) for consulted and used
    const { count: consultedCount } = await supabase
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("used", false);
    const { count: usedCount } = await supabase
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("used", true);

    const consulted = consultedCount || 0;
    const used = usedCount || 0;

    setStats({
      pending,
      consulted,
      used,
      manual_review,
      total: pending + consulted + used + manual_review,
    });
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

          // Images → always manual review (OCR unreliable for CPF)
          if (doc.file_type?.startsWith("image/")) {
            addLog(`[INFO] Imagem detectada → Enviado para revisão manual`);
            await supabase
              .from("documents")
              .update({ status: "manual_review" })
              .eq("id", doc.id);
            continue;
          }

          if (doc.file_type !== "application/pdf") {
            addLog(`[INFO] Tipo não suportado: ${doc.file_type} → Enviado para revisão manual`);
            await supabase
              .from("documents")
              .update({ status: "manual_review" })
              .eq("id", doc.id);
            continue;
          }

          // PDF processing
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

          // Extract digital text from PDF (simple join - proven method)
          addLog(`[INFO] Tentando extrair texto digital do PDF...`);
          let extractedText = "";
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageText = textContent.items.map((item: any) => item.str || "").join(" ");
            extractedText += " " + pageText;
            addLog(`[INFO] Texto página ${i}: ${pageText.substring(0, 120)}...`);
          }

          // Check if this is a CNH Digital (auto-processable)
          const isCNH = /CNH|HABILITA|CARTEIRA\s*NACIONAL|SENATRAN|DETRAN/i.test(extractedText);

          if (!isCNH) {
            // Not a CNH Digital → send to manual review
            addLog(`[INFO] Documento não é CNH Digital → Enviado para revisão manual`);
            await supabase
              .from("documents")
              .update({ status: "manual_review", extracted_text: extractedText.substring(0, 500) })
              .eq("id", doc.id);
            continue;
          }

          // CNH Digital: try to extract CPF from digital text
          let cpf = extractCPF(extractedText);

          // If not found in digital text, try OCR as fallback
          if (!cpf) {
            addLog(`[INFO] CPF não encontrado no texto digital da CNH. Usando OCR...`);
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 3.0 });
              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext("2d")!;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await page.render({ canvasContext: ctx, viewport } as any).promise;

              const imageUrl = canvas.toDataURL("image/png");
              const { data: ocrData } = await Tesseract.recognize(imageUrl, "por");
              extractedText += "\n" + ocrData.text;
              addLog(`[INFO] OCR página ${i}/${numPages} concluído`);

              cpf = extractCPF(extractedText);
              if (cpf) break;
            }
          }

          if (cpf) {
            addLog(`[OK] CPF encontrado: ${formatCPF(cpf)} em ${doc.file_name}`);
            extracted.push({ docId: doc.id, cpf });
          } else {
            addLog(`[AVISO] CPF não encontrado na CNH: ${doc.file_name} → Enviado para revisão manual`);
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
