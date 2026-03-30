"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import PersonCard, { Person } from "@/components/PersonCard";

// Brazilian states for dropdown
const STATES = [
  "", "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

interface Filters {
  search: string;
  state: string;
  usedStatus: "all" | "used" | "not_used";
  scoreMin: string;
  scoreMax: string;
  incomeMin: string;
  incomeMax: string;
  city: string;
  profession: string;
  hasPhone: "all" | "yes" | "no";
  hasEmail: "all" | "yes" | "no";
}

const defaultFilters: Filters = {
  search: "",
  state: "",
  usedStatus: "all",
  scoreMin: "",
  scoreMax: "",
  incomeMin: "",
  incomeMax: "",
  city: "",
  profession: "",
  hasPhone: "all",
  hasEmail: "all",
};

function parseNumber(val: string | null | undefined): number {
  if (!val) return 0;
  // Remove "R$", dots (thousands), and replace comma with dot for decimals
  const cleaned = val
    .replace(/[Rr$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export default function FiltrosPage() {
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [filtered, setFiltered] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [notUsedCount, setNotUsedCount] = useState(0);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("people")
      .select("*, documents(id, file_name, file_url, file_path, file_type)")
      .order("created_at", { ascending: false });
    if (data) {
      setAllPeople(data);
      setTotalCount(data.length);
      setUsedCount(data.filter((p: Person) => p.used).length);
      setNotUsedCount(data.filter((p: Person) => !p.used).length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Apply filters
  useEffect(() => {
    let result = [...allPeople];

    // Text search (name or CPF)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.cpf?.includes(q)
      );
    }

    // State
    if (filters.state) {
      result = result.filter(
        (p) => p.state?.toUpperCase() === filters.state.toUpperCase()
      );
    }

    // City
    if (filters.city.trim()) {
      const c = filters.city.toLowerCase();
      result = result.filter((p) => p.city?.toLowerCase().includes(c));
    }

    // Profession
    if (filters.profession.trim()) {
      const prof = filters.profession.toLowerCase();
      result = result.filter((p) => p.profession?.toLowerCase().includes(prof));
    }

    // Used status
    if (filters.usedStatus === "used") {
      result = result.filter((p) => p.used === true);
    } else if (filters.usedStatus === "not_used") {
      result = result.filter((p) => !p.used);
    }

    // Score range
    if (filters.scoreMin) {
      const min = parseFloat(filters.scoreMin);
      if (!isNaN(min)) result = result.filter((p) => parseNumber(p.score) >= min);
    }
    if (filters.scoreMax) {
      const max = parseFloat(filters.scoreMax);
      if (!isNaN(max)) result = result.filter((p) => parseNumber(p.score) <= max);
    }

    // Income range
    if (filters.incomeMin) {
      const min = parseFloat(filters.incomeMin);
      if (!isNaN(min)) result = result.filter((p) => parseNumber(p.income) >= min);
    }
    if (filters.incomeMax) {
      const max = parseFloat(filters.incomeMax);
      if (!isNaN(max)) result = result.filter((p) => parseNumber(p.income) <= max);
    }

    // Has phone
    if (filters.hasPhone === "yes") {
      result = result.filter(
        (p) => (p.phones?.length > 0) || !!p.phone
      );
    } else if (filters.hasPhone === "no") {
      result = result.filter(
        (p) => (!p.phones || p.phones.length === 0) && !p.phone
      );
    }

    // Has email
    if (filters.hasEmail === "yes") {
      result = result.filter(
        (p) => (p.emails?.length > 0) || !!p.email
      );
    } else if (filters.hasEmail === "no") {
      result = result.filter(
        (p) => (!p.emails || p.emails.length === 0) && !p.email
      );
    }

    setFiltered(result);
    setPage(1);
  }, [filters, allPeople]);

  const paginatedPeople = filtered.slice(0, page * perPage);
  const hasMore = paginatedPeople.length < filtered.length;

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "search" || key === "city" || key === "profession" || key === "scoreMin" || key === "scoreMax" || key === "incomeMin" || key === "incomeMax") return val !== "";
    if (key === "state") return val !== "";
    if (key === "usedStatus" || key === "hasPhone" || key === "hasEmail") return val !== "all";
    return false;
  }).length;

  const handleToggleUsed = async (personId: string) => {
    const person = allPeople.find((p) => p.id === personId);
    if (!person) return;
    const newUsed = !person.used;
    await supabase.from("people").update({ used: newUsed }).eq("id", personId);
    if (newUsed) {
      await supabase.from("documents").update({ status: "used" }).eq("person_id", personId);
    } else {
      await supabase.from("documents").update({ status: "consulted" }).eq("person_id", personId);
    }
    loadPeople();
  };

  // Export filtered results as CSV
  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Nome", "CPF", "Data Nascimento", "Mae", "Profissao", "Cidade", "Estado", "Score", "Renda", "Telefones", "Emails", "Status"];
    const rows = filtered.map((p) => [
      p.name || "",
      p.cpf || "",
      p.birth_date || "",
      p.mother_name || "",
      p.profession || "",
      p.city || "",
      p.state || "",
      p.score || "",
      p.income || "",
      (p.phones?.join("; ") || p.phone || ""),
      (p.emails?.join("; ") || p.email || ""),
      p.used ? "Usado" : "Disponivel",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riko_filtros_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Fichas" value={totalCount} color="text-primary" />
        <StatCard label="Resultados" value={filtered.length} color="text-info" />
        <StatCard label="Disponíveis" value={notUsedCount} color="text-success" />
        <StatCard label="Usados" value={usedCount} color="text-warning" />
      </div>

      {/* Filter toggle + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-ghost !py-2 !px-4 !text-[12px] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="btn-ghost !py-2 !px-3 !text-[11px] text-danger !border-danger/20 hover:!bg-danger-muted"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-disabled text-[12px]">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="btn-ghost !py-2 !px-4 !text-[12px] flex items-center gap-2 text-success !border-success/20 hover:!bg-success-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="glass-static rounded-2xl p-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <FilterInput
              label="Buscar (nome ou CPF)"
              value={filters.search}
              onChange={(v) => updateFilter("search", v)}
              placeholder="Digite nome ou CPF..."
            />

            {/* State */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                Estado (UF)
              </label>
              <select
                value={filters.state}
                onChange={(e) => updateFilter("state", e.target.value)}
                className="w-full bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">Todos os estados</option>
                {STATES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <FilterInput
              label="Cidade"
              value={filters.city}
              onChange={(v) => updateFilter("city", v)}
              placeholder="Digite a cidade..."
            />

            {/* Profession */}
            <FilterInput
              label="Profissão"
              value={filters.profession}
              onChange={(v) => updateFilter("profession", v)}
              placeholder="Digite a profissão..."
            />

            {/* Used status */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                Status
              </label>
              <select
                value={filters.usedStatus}
                onChange={(e) => updateFilter("usedStatus", e.target.value as Filters["usedStatus"])}
                className="w-full bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="all">Todos</option>
                <option value="not_used">Disponíveis</option>
                <option value="used">Usados</option>
              </select>
            </div>

            {/* Score range */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                Score (mín - máx)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.scoreMin}
                  onChange={(e) => updateFilter("scoreMin", e.target.value)}
                  placeholder="Mín"
                  className="w-1/2 bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                />
                <input
                  type="number"
                  value={filters.scoreMax}
                  onChange={(e) => updateFilter("scoreMax", e.target.value)}
                  placeholder="Máx"
                  className="w-1/2 bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Income range */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                Renda (mín - máx)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.incomeMin}
                  onChange={(e) => updateFilter("incomeMin", e.target.value)}
                  placeholder="Mín"
                  className="w-1/2 bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                />
                <input
                  type="number"
                  value={filters.incomeMax}
                  onChange={(e) => updateFilter("incomeMax", e.target.value)}
                  placeholder="Máx"
                  className="w-1/2 bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Has phone */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                Telefone
              </label>
              <select
                value={filters.hasPhone}
                onChange={(e) => updateFilter("hasPhone", e.target.value as Filters["hasPhone"])}
                className="w-full bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="all">Todos</option>
                <option value="yes">Com telefone</option>
                <option value="no">Sem telefone</option>
              </select>
            </div>

            {/* Has email */}
            <div>
              <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
                E-mail
              </label>
              <select
                value={filters.hasEmail}
                onChange={(e) => updateFilter("hasEmail", e.target.value as Filters["hasEmail"])}
                className="w-full bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="all">Todos</option>
                <option value="yes">Com e-mail</option>
                <option value="no">Sem e-mail</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-static rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-text-disabled mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-text-tertiary text-[14px]">Nenhum resultado encontrado</p>
          <p className="text-text-disabled text-[12px] mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPeople.map((person, i) => (
            <div key={person.id} className="relative">
              {/* Used/Available badge */}
              <div className="absolute top-4 right-28 z-10">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                    person.used
                      ? "bg-warning-muted text-warning"
                      : "bg-success-muted text-success"
                  }`}
                >
                  {person.used ? "Usado" : "Disponível"}
                </span>
              </div>
              <PersonCard
                person={person}
                actionLabel={person.used ? "Desfazer Usado" : "Marcar como Usado"}
                actionColor={person.used ? "warning" : "success"}
                onAction={handleToggleUsed}
                onDocumentsChanged={loadPeople}
                index={i}
              />
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost !py-2.5 !px-6 !text-[12px] text-primary !border-primary/20 hover:!bg-primary-muted"
              >
                Carregar mais ({filtered.length - paginatedPeople.length} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable filter input
function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-text-disabled text-[10px] uppercase tracking-wider font-medium mb-1.5 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-0 border border-surface-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary/50 transition-colors"
      />
    </div>
  );
}

// Stat card
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-static rounded-2xl p-4">
      <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
        {label}
      </span>
      <p className={`text-2xl font-bold mt-1 ${color}`} style={{ fontFamily: "var(--font-heading)" }}>
        {value}
      </p>
    </div>
  );
}
