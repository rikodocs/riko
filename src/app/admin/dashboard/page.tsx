"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [scanMsg, setScanMsg] = useState<string | null>(null);

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
    setScanMsg(null);
    let totalScanned = 0;
    let totalCnh = 0;

    try {
      // Scan in batches of 50 until no more pending
      for (let i = 0; i < 100; i++) {
        const r = await fetch("/api/scanner/qr-cnh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "scan-all" }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        totalScanned += b.scanned;
        totalCnh += b.cnh_digital || 0;
        const totalRg = (b.rg_digital || 0);
        setScanMsg(`Escaneando... ${totalScanned} docs processados, ${totalCnh} CNH digital, ${totalRg} RG digital`);
        if (b.scanned === 0) break;
      }
      setScanMsg(`Pronto! ${totalScanned} docs escaneados`);
    } catch (err) {
      setScanMsg(`Erro: ${err instanceof Error ? err.message : "falha"}`);
    }
    setScanning(false);
    loadScanStats();
    loadStats();
  }

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

      {/* Scanner de CNH Digital */}
      <div className="glass-static rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scanner de CNH Digital
            </h2>
            <p className="text-text-tertiary text-xs mt-1 leading-relaxed max-w-xl">
              Escaneia o QR code dos PDFs pra separar automaticamente: <strong className="text-success">CNH Digital</strong>, <strong className="text-primary">RG Digital</strong> e <strong className="text-text-secondary">Outros</strong>. O moderador não precisa mais separar manualmente.
            </p>
          </div>
          <button onClick={handleScanAll} disabled={scanning || scan.pending_scan === 0} className="btn-primary shrink-0">
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Escaneando...
              </>
            ) : scan.pending_scan > 0 ? (
              `Escanear ${scan.pending_scan} docs`
            ) : (
              "Tudo escaneado"
            )}
          </button>
        </div>

        {scanMsg && (
          <p className={`mt-3 text-xs font-medium ${scanMsg.startsWith("Erro") ? "text-danger" : "text-success"}`}>
            {scanMsg}
          </p>
        )}

        {/* Category counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-surface-1 border border-surface-border rounded-xl p-4">
            <p className="eyebrow mb-1">CNH Digital</p>
            <p className="stat-value text-success">{scan.cnh_digital}</p>
            <p className="text-[11px] text-text-disabled mt-1">QR SENATRAN</p>
          </div>
          <div className="bg-surface-1 border border-surface-border rounded-xl p-4">
            <p className="eyebrow mb-1">RG Digital</p>
            <p className="stat-value text-primary">{scan.rg_digital}</p>
            <p className="text-[11px] text-text-disabled mt-1">QR gov.br/cin</p>
          </div>
          <div className="bg-surface-1 border border-surface-border rounded-xl p-4">
            <p className="eyebrow mb-1">Outros</p>
            <p className="stat-value text-text-secondary">{scan.outro}</p>
            <p className="text-[11px] text-text-disabled mt-1">CNH física, RG físico, etc</p>
          </div>
          <div className="bg-surface-1 border border-surface-border rounded-xl p-4">
            <p className="eyebrow mb-1">Aguardando scan</p>
            <p className="stat-value text-warning">{scan.pending_scan}</p>
            <p className="text-[11px] text-text-disabled mt-1">Não escaneados</p>
          </div>
        </div>
      </div>

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
            <strong className="text-text-secondary">3.</strong> CNH Digital com QR válido pode ir direto pro estoque. Outros vão pra moderação manual.
          </p>
          <p>
            <strong className="text-text-secondary">4.</strong> Operadores pegam do estoque em <code>/operacao</code> e baixam.
          </p>
        </div>
      </div>
    </div>
  );
}
