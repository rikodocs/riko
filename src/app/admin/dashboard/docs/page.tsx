"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Person {
  id: string;
  cpf: string;
  name: string;
  birth_date: string;
  mother_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  score: string;
  income: string;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export default function DocsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("people")
      .select("*")
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

  const filtered = people.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.cpf?.includes(search)
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="input-base w-full pl-10"
          />
        </div>
        <span className="text-[11px] text-text-disabled font-mono">{filtered.length} docs</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-static rounded-2xl p-5 animate-shimmer h-20" />
          ))}
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
          {filtered.map((person, i) => (
            <div key={person.id} className="glass-static rounded-2xl overflow-hidden stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-glass-hover transition-colors"
                onClick={() => setExpanded(expanded === person.id ? null : person.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center text-primary font-bold text-sm"
                       style={{ fontFamily: "var(--font-heading)" }}>
                    {person.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium text-[13px]">
                      {person.name || "Nome não disponível"}
                    </p>
                    <p className="text-text-disabled text-[11px] font-mono">
                      CPF: {person.cpf}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsUsed(person.id); }}
                    className="btn-ghost !py-1.5 !px-3 !text-[11px] !rounded-lg text-success !border-success/20 hover:!bg-success-muted"
                  >
                    Marcar como Usado
                  </button>
                  <svg
                    className={`w-4 h-4 text-text-disabled transition-transform duration-200 ${expanded === person.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded */}
              {expanded === person.id && (
                <div className="px-5 pb-5 border-t border-surface-border pt-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                    <InfoRow label="Nome" value={person.name} />
                    <InfoRow label="CPF" value={person.cpf} />
                    <InfoRow label="Data de Nascimento" value={person.birth_date} />
                    <InfoRow label="Nome da Mãe" value={person.mother_name} />
                    <InfoRow label="Telefone" value={person.phone} />
                    <InfoRow label="E-mail" value={person.email} />
                    <InfoRow label="Endereço" value={person.address} />
                    <InfoRow label="Cidade" value={person.city} />
                    <InfoRow label="Estado" value={person.state} />
                    <InfoRow label="Score" value={person.score} />
                    <InfoRow label="Renda" value={person.income} />
                  </div>
                  {person.raw_data && (
                    <details className="mt-4">
                      <summary className="text-[11px] text-text-disabled cursor-pointer hover:text-text-tertiary transition-colors">
                        Dados completos da API
                      </summary>
                      <pre className="mt-2 bg-surface-0 rounded-xl border border-surface-border p-3 text-[10px] text-text-tertiary overflow-auto max-h-64 font-mono">
                        {JSON.stringify(person.raw_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="bg-surface-0 rounded-lg px-3 py-2">
      <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">{label}</span>
      <p className="text-text-secondary text-[13px]">{value || "—"}</p>
    </div>
  );
}
