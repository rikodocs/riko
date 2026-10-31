"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { fetchDocBlob, readQrFromBlob, type DocScan } from "@/lib/qr-reader";
import { splitPdfPages } from "@/lib/pdf-split";

async function splitIfMultiPage(doc: { id: string; file_name: string }, blob: Blob): Promise<number> {
  const pages = await splitPdfPages(new File([blob], doc.file_name, { type: "application/pdf" }));
  if (pages.length <= 1) return 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const safe = page.name.replace(/\.pdf$/i, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "doc";
    const path = `${Date.now()}_${i}_${safe}.pdf`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, page);
    if (upErr) throw new Error(upErr.message);
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    const { error: insErr } = await supabase.from("documents").insert({
      file_name: page.name,
      file_path: path,
      file_url: urlData.publicUrl,
      file_type: "application/pdf",
      status: "pending_review",
    });
    if (insErr) throw new Error(insErr.message);
  }
  // Original fica guardado (não apagado), só sai da fila.
  await supabase.from("documents").update({ status: "rejected", doc_category: "dividido" }).eq("id", doc.id);
  return pages.length;
}

type Category = "cnh_digital" | "rg_digital" | "outro" | "pending_scan";
interface ListDoc { id: string; file_name: string; file_type: string; qr_data: string | null; created_at: string }
const CAT_LABEL: Record<Category, string> = {
  cnh_digital: "CNH Digital", rg_digital: "RG Digital", outro: "Outros", pending_scan: "Aguardando scan",
};

interface Stats {
  pending: number;
  approved: number;
  withOperators: number;
  downloaded: number;
  rejectedMod: number;
  total: number;
}

interface ScanStats {
  cnh_digital: number;
  rg_digital: number;
  outro: number;
  pending_scan: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pending: 0, approved: 0, withOperators: 0, downloaded: 0, rejectedMod: 0, total: 0,
  });
  const [scan, setScan] = useState<ScanStats>({ cnh_digital: 0, rg_digital: 0, outro: 0, pending_scan: 0 });
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const abortRef = useRef(false);
  const [progress, setProgress] = useState<{ current: number; total: number; lastFile: string; lastCategory: string } | null>(null);
  const [listCat, setListCat] = useState<Category | null>(null);
  const [listDocs, setListDocs] = useState<ListDoc[] | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadScanStats();
  }, []);

  function base() {
    return supabase.from("documents").select("id", { count: "exact", head: true });
  }
  async function count(apply: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
    const { count: c } = await apply(base());
    return c || 0;
  }

  async function loadStats() {
    const [pending, approved, withOperators, downloaded, rejectedMod, total] = await Promise.all([
      count((q) => q.eq("status", "pending_review")),
      count((q) => q.eq("status", "available").is("assigned_to", null)),
      count((q) => q.eq("status", "available").not("assigned_to", "is", null)),
      count((q) => q.eq("status", "downloaded")),
      count((q) => q.eq("status", "rejected_mod")),
      count((q) => q),
    ]);
    setStats({ pending, approved, withOperators, downloaded, rejectedMod, total });
  }

  async function loadScanStats() {
    try {
      const r = await fetch("/api/scanner/qr-cnh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats" }),
      });
      if (r.ok) setScan(await r.json());
    } catch { /* */ }
  }

  async function handleScanAll() {
    setScanning(true);
    setPaused(false);
    pausedRef.current = false;
    abortRef.current = false;

    const totalToScan = scan.pending_scan;
    let scanned = 0;

    setProgress({ current: 0, total: totalToScan, lastFile: "", lastCategory: "" });

    const failed: string[] = [];
    try {
      while (true) {
        while (pausedRef.current && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 300));
        }
        if (abortRef.current) break;

        const nr = await api({ action: "next", skip: failed });
        const doc = nr.doc as { id: string; file_name: string; file_type: string } | null;
        if (!doc) break;

        let res: DocScan;
        try {
          const blob = await fetchDocBlob(doc.id);
          if (doc.file_type === "application/pdf") {
            const parts = await splitIfMultiPage(doc, blob);
            if (parts > 0) {
              scanned++;
              setScan((prev) => ({ ...prev, pending_scan: prev.pending_scan - 1 + parts }));
              setProgress({ current: scanned, total: totalToScan, lastFile: doc.file_name, lastCategory: `Dividido em ${parts}` });
              continue;
            }
          }
          res = await readQrFromBlob(blob, doc.file_type);
        } catch {
          failed.push(doc.id);
          scanned++;
          setProgress({ current: scanned, total: totalToScan, lastFile: doc.file_name, lastCategory: "erro" });
          continue;
        }
        const b = await api({ action: "save", docId: doc.id, qr: res.qr, text: res.text });
        b.file_name = doc.file_name;

        scanned++;
        const cat = b.category as string;
        const catLabel = cat === "cnh_digital" ? "CNH Digital" : cat === "rg_digital" ? "RG Digital" : "Outro";

        setScan((prev) => ({
          ...prev,
          [cat]: (prev[cat as keyof ScanStats] || 0) + 1,
          pending_scan: Math.max(0, prev.pending_scan - 1),
        }));

        setProgress({
          current: scanned,
          total: totalToScan,
          lastFile: b.file_name || `Doc ${scanned}`,
          lastCategory: catLabel,
        });
      }
    } catch (err) {
      setProgress((prev) => prev ? { ...prev, lastFile: `Erro: ${err instanceof Error ? err.message : "falha"}`, lastCategory: "erro" } : null);
    }

    setScanning(false);
    setPaused(false);
    loadScanStats();
    loadStats();
  }

  async function api(payload: Record<string, unknown>) {
    const r = await fetch("/api/scanner/qr-cnh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || "falha");
    return b;
  }

  async function openList(category: Category) {
    setListCat(category);
    setListDocs(null);
    setPreviewId(null);
    const b = await api({ action: "list", category });
    setListDocs(b.docs);
  }

  async function handleResetOutros() {
    if (!confirm(`Re-escanear os ${scan.outro} docs marcados como Outros?`)) return;
    await api({ action: "reset" });
    setProgress(null);
    await loadScanStats();
  }

  function handlePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }

  function handleStop() {
    abortRef.current = true;
    pausedRef.current = false;
    setPaused(false);
  }

  const pct = progress ? Math.min(100, Math.round((progress.current / Math.max(progress.total, 1)) * 100)) : 0;

  const statCards = [
    { label: "Aguardando moderação", value: stats.pending, color: "text-warning" },
    { label: "Aprovados", value: stats.approved, color: "text-success" },
    { label: "Com operadores", value: stats.withOperators, color: "text-primary" },
    { label: "Baixados", value: stats.downloaded, color: "text-text-secondary" },
    { label: "Recusados (mod.)", value: stats.rejectedMod, color: "text-danger" },
    { label: "Total", value: stats.total, color: "text-text-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="glass-static rounded-lg p-5 stagger-item" style={{ animationDelay: `${i * 60}ms` }}>
            <p className="text-text-tertiary text-[11px] uppercase tracking-[0.1em] font-medium mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              {card.label}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${card.color}`} style={{ fontFamily: "var(--font-heading)" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Scanner */}
      <div className="glass-static rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scanner de Documentos
            </h2>
            <p className="text-text-tertiary text-xs mt-1 leading-relaxed max-w-xl">
              Escaneia o QR code dos PDFs pra separar automaticamente: <strong className="text-success">CNH Digital</strong>, <strong className="text-primary">RG Digital</strong> e <strong className="text-text-secondary">Outros</strong>. O moderador não precisa mais separar manualmente.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {scanning && (
              <>
                <button onClick={handlePause} className="px-3 py-2 rounded-lg text-xs font-medium border border-surface-border bg-surface-1 text-text-secondary hover:bg-surface-2 transition-colors">
                  {paused ? "Continuar" : "Pausar"}
                </button>
                <button onClick={handleStop} className="px-3 py-2 rounded-lg text-xs font-medium border border-danger/30 bg-danger-muted text-danger hover:bg-danger/20 transition-colors">
                  Parar
                </button>
              </>
            )}
            {!scanning && (
              <button onClick={handleScanAll} disabled={scan.pending_scan === 0} className="btn-primary">
                {scan.pending_scan > 0 ? `Escanear ${scan.pending_scan} docs` : "Tudo escaneado"}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {scanning && progress && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">
                {paused ? "Pausado" : "Escaneando"} — {progress.current} de {progress.total}
              </span>
              <span className="text-text-disabled font-mono">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${paused ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {progress.lastFile && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  progress.lastCategory === "CNH Digital" ? "bg-success" :
                  progress.lastCategory === "RG Digital" ? "bg-primary" :
                  progress.lastCategory === "erro" ? "bg-danger" : "bg-text-disabled"
                }`} />
                <span className="text-text-tertiary truncate">{progress.lastFile}</span>
                <span className="text-text-disabled">→</span>
                <span className={`font-medium ${
                  progress.lastCategory === "CNH Digital" ? "text-success" :
                  progress.lastCategory === "RG Digital" ? "text-primary" :
                  progress.lastCategory === "erro" ? "text-danger" : "text-text-secondary"
                }`}>{progress.lastCategory}</span>
              </div>
            )}
          </div>
        )}

        {/* Finished message */}
        {!scanning && progress && progress.current > 0 && (
          <p className="mt-3 text-xs font-medium text-success">
            Pronto! {progress.current} docs escaneados.
          </p>
        )}

        {/* Category counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {([
            ["cnh_digital", "text-success", "Aprovado · no estoque"],
            ["rg_digital", "text-primary", "Aprovado · no estoque"],
            ["outro", "text-text-secondary", "CNH física, RG físico, etc"],
            ["pending_scan", "text-warning", "Não escaneados"],
          ] as [Category, string, string][]).map(([cat, color, hint]) => (
            <button
              key={cat}
              onClick={() => openList(cat)}
              className="text-left bg-surface-1 border border-surface-border rounded-xl p-4 hover:border-primary/50 hover:bg-surface-2 transition-colors"
            >
              <p className="eyebrow mb-1">{CAT_LABEL[cat]}</p>
              <p className={`stat-value ${color}`}>{scan[cat]}</p>
              <p className="text-[11px] text-text-disabled mt-1">{hint} · ver docs →</p>
            </button>
          ))}
        </div>

        {!scanning && scan.outro > 0 && (
          <button onClick={handleResetOutros} className="mt-4 text-xs text-text-tertiary hover:text-primary underline underline-offset-2">
            Re-escanear os {scan.outro} docs em Outros
          </button>
        )}
      </div>

      {listCat && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setListCat(null)}>
          <div className="bg-surface-1 border border-surface-border rounded-xl shadow-2xl w-full max-w-5xl h-[min(80vh,720px)] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                {CAT_LABEL[listCat]} {listDocs && <span className="text-text-tertiary font-normal">({listDocs.length})</span>}
              </h3>
              <button onClick={() => setListCat(null)} className="text-text-tertiary hover:text-text-primary text-xl leading-none">×</button>
            </div>
            <div className="flex-1 flex min-h-0">
              <div className="w-72 shrink-0 border-r border-surface-border overflow-y-auto">
                {listDocs === null ? (
                  <p className="p-5 text-xs text-text-tertiary">Carregando...</p>
                ) : listDocs.length === 0 ? (
                  <p className="p-5 text-xs text-text-tertiary">Nenhum documento.</p>
                ) : (
                  listDocs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setPreviewId(d.id)}
                      className={`w-full text-left px-4 py-2.5 border-b border-surface-border text-xs hover:bg-glass-hover ${previewId === d.id ? "bg-primary-muted text-primary" : "text-text-secondary"}`}
                    >
                      <p className="truncate">{d.file_name}</p>
                      {d.qr_data && <p className="truncate text-[10px] text-text-disabled mt-0.5">{d.qr_data}</p>}
                    </button>
                  ))
                )}
              </div>
              <div className="flex-1 bg-surface-0">
                {previewId ? (
                  <iframe key={previewId} src={`/api/documento/${previewId}?viewerId=admin&admin=true`} className="w-full h-full" />
                ) : (
                  <p className="p-5 text-xs text-text-tertiary">Clique num documento pra visualizar.</p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Como funciona */}
      <div className="glass-static rounded-lg p-6">
        <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          Como funciona agora
        </h2>
        <div className="text-text-tertiary text-xs mt-2 leading-relaxed space-y-2">
          <p>
            <strong className="text-text-secondary">1.</strong> Suba os documentos em <strong className="text-text-secondary">Imports</strong> — PDFs com mais de 1 página são divididos automaticamente.
          </p>
          <p>
            <strong className="text-text-secondary">2.</strong> Clique <strong className="text-text-secondary">Escanear</strong> — o sistema lê o QR code de cada PDF e separa em CNH Digital, RG Digital e Outros.
          </p>
          <p>
            <strong className="text-text-secondary">3.</strong> CNH Digital e RG Digital são aprovados automaticamente e vão direto pro estoque. Outros vão pra moderação manual.
          </p>
          <p>
            <strong className="text-text-secondary">4.</strong> Operadores pegam do estoque em <code>/operacao</code> e baixam.
          </p>
        </div>
      </div>
    </div>
  );
}
