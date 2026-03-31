"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import PersonCard, { Person } from "@/components/PersonCard";
import JSZip from "jszip";

const PER_PAGE = 20;

export default function DocsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [batchQty, setBatchQty] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("people")
      .select("*, documents(id, file_name, file_url, file_path, file_type)")
      .eq("used", false)
      .order("created_at", { ascending: false });
    if (data) setPeople(data);
    setLoading(false);
  }

  async function markAsUsed(personId: string) {
    await supabase.from("people").update({ used: true }).eq("id", personId);
    await supabase.from("documents").update({ status: "used" }).eq("person_id", personId);
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }

  function cleanFileName(name: string, index: number, ext: string, total: number) {
    const clean = (name || "documento")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    return total > 1 ? `${clean}_${index + 1}.${ext}` : `${clean}.${ext}`;
  }

  async function handleBatchExport() {
    const qty = parseInt(batchQty);
    if (!qty || qty <= 0) return;
    if (qty > people.length) {
      setExportMsg(`Só existem ${people.length} docs disponíveis.`);
      setTimeout(() => setExportMsg(null), 3000);
      return;
    }

    setExporting(true);
    setExportMsg(null);

    try {
      const batch = people.slice(0, qty);
      const zip = new JSZip();
      let downloadCount = 0;

      for (const person of batch) {
        const docs = person.documents || [];
        for (let di = 0; di < docs.length; di++) {
          const doc = docs[di];
          try {
            const res = await fetch(doc.file_url);
            const blob = await res.blob();
            const ext = doc.file_name?.split(".").pop()?.toLowerCase() || "pdf";
            const fileName = cleanFileName(person.name, di, ext, docs.length);
            zip.file(fileName, blob);
            downloadCount++;
          } catch {
            // Skip failed downloads
          }
        }
      }

      if (downloadCount === 0) {
        setExportMsg("Nenhum arquivo baixado.");
        setExporting(false);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const zipName = `${qty}docs${dd}${mm}${yy}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      for (const person of batch) {
        await supabase.from("people").update({ used: true }).eq("id", person.id);
        await supabase.from("documents").update({ status: "used" }).eq("person_id", person.id);
      }

      const batchIds = new Set(batch.map((p) => p.id));
      setPeople((prev) => prev.filter((p) => !batchIds.has(p.id)));

      setExportMsg(`${qty} docs exportados e marcados como usados!`);
      setBatchQty("");
    } catch (err) {
      setExportMsg(`Erro ao exportar: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(null), 5000);
    }
  }

  const filtered = people.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.cpf?.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Adjust page if it's out of bounds
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [filtered.length, totalPages, currentPage]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search + Export bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF..." className="input-base w-full pl-10" />
        </div>
        <span className="text-[11px] text-text-disabled font-mono">{filtered.length} docs</span>
      </div>

      {/* Batch export */}
      {people.length > 0 && (
        <div className="glass-static rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-sm text-text-secondary font-medium">Exportar Lote</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={people.length}
              value={batchQty}
              onChange={(e) => setBatchQty(e.target.value)}
              placeholder={`1-${people.length}`}
              disabled={exporting}
              className="w-24 bg-surface-1 border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono disabled:opacity-50 text-center"
            />
            <button
              onClick={handleBatchExport}
              disabled={exporting || !batchQty || parseInt(batchQty) <= 0}
              className={`btn-primary !py-2 !px-4 !text-xs flex items-center gap-2 ${exporting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {exporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Baixar ZIP + Marcar Usados
                </>
              )}
            </button>
          </div>
          {exportMsg && (
            <span className={`text-xs font-medium ${exportMsg.includes("exportados") ? "text-success" : "text-danger"}`}>
              {exportMsg}
            </span>
          )}
        </div>
      )}

      {/* Pagination top */}
      {filtered.length > PER_PAGE && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass-static rounded-2xl p-5 animate-shimmer h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-static rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-glass mx-auto mb-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-text-tertiary text-sm">Nenhum documento consultado disponível.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPeople.map((person, i) => (
            <PersonCard
              key={person.id}
              person={person}
              actionLabel="Marcar como Usado"
              actionColor="success"
              onAction={markAsUsed}
              onDocumentsChanged={loadDocs}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Pagination bottom */}
      {filtered.length > PER_PAGE && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          total={filtered.length}
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
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-glass-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-text-disabled text-[12px]">...</span>
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
