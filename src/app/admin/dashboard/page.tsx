"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Tesseract from "tesseract.js";

interface Stats {
  pending: number;
  consulted: number;
  used: number;
  total: number;
}

interface PendingDoc {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
}

// Extract CPF from text
function extractCPF(text: string): string | null {
  const patterns = [
    /\d{3}\.\d{3}\.\d{3}-\d{2}/,
    /\d{11}/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cpf = match[0].replace(/\D/g, "");
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
  const [stats, setStats] = useState<Stats>({ pending: 0, consulted: 0, used: 0, total: 0 });
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
            // For PDF: convert to image first using canvas, then OCR
            addLog(`[INFO] Processando PDF...`);
            const arrayBuffer = await fileData.arrayBuffer();
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = Math.min(pdf.numPages, 5); // Max 5 pages

            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
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

              // Stop if we found a CPF
              if (extractCPF(extractedText)) break;
            }
          }

          // Try to extract CPF
          const cpf = extractCPF(extractedText);

          if (cpf) {
            addLog(`[OK] CPF encontrado: ${formatCPF(cpf)} em ${doc.file_name}`);
            extracted.push({ docId: doc.id, cpf });
          } else {
            addLog(`[ERRO] CPF não encontrado em: ${doc.file_name}`);
            // Mark as error
            await supabase
              .from("documents")
              .update({ status: "error", extracted_text: extractedText.substring(0, 500) })
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
    { label: "Pendentes", value: stats.pending, color: "text-warning" },
    { label: "Consultados", value: stats.consulted, color: "text-cyan-primary" },
    { label: "Usados", value: stats.used, color: "text-success" },
    { label: "Total", value: stats.total, color: "text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-surface-border rounded-xl p-5"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Consultar Button */}
      <div className="bg-surface border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Consultar Documentos</h2>
            <p className="text-sm text-gray-500">
              Processa documentos pendentes: extrai CPF via OCR e consulta na API
            </p>
          </div>
          <button
            onClick={handleConsultar}
            disabled={consulting || stats.pending === 0}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              consulting || stats.pending === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-cyan-primary text-black hover:bg-cyan-dark glow-cyan"
            }`}
          >
            {consulting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Consultando...
              </span>
            ) : (
              `Consultar (${stats.pending} pendentes)`
            )}
          </button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {notifications.map((note, i) => (
              <div
                key={i}
                className="bg-warning/10 border border-warning/30 text-warning px-4 py-2 rounded-lg text-sm"
              >
                {note}
              </div>
            ))}
          </div>
        )}

        {/* Console Log */}
        {consultLog.length > 0 && (
          <div className="bg-black/50 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1">
            {consultLog.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("Erro") || line.startsWith("[ERRO")
                    ? "text-danger"
                    : line.startsWith("[OK")
                    ? "text-success"
                    : line.startsWith("[AVISO") || line.startsWith("[DUPLICADO")
                    ? "text-warning"
                    : "text-gray-400"
                }
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
