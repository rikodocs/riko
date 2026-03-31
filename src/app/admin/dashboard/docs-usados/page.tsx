"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import PersonCard, { Person } from "@/components/PersonCard";

const PER_PAGE = 20;

export default function DocsUsadosPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("people")
      .select("*, documents(id, file_name, file_url, file_path, file_type)")
      .eq("used", true)
      .order("created_at", { ascending: false });
    if (data) setPeople(data);
    setLoading(false);
  }

  async function unmarkUsed(personId: string) {
    await supabase.from("people").update({ used: false }).eq("id", personId);
    await supabase.from("documents").update({ status: "consulted" }).eq("person_id", personId);
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }

  const filtered = people.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.cpf?.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [filtered.length, totalPages, currentPage]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF..." className="input-base w-full pl-10" />
        </div>
        <span className="text-[11px] text-text-disabled font-mono">{filtered.length} usados</span>
      </div>

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-text-tertiary text-sm">Nenhum documento usado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPeople.map((person, i) => (
            <PersonCard
              key={person.id}
              person={person}
              actionLabel="Desfazer Usado"
              actionColor="warning"
              onAction={unmarkUsed}
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
