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

  useEffect(() => {
    loadDocs();
  }, []);

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
    await supabase
      .from("documents")
      .update({ status: "used" })
      .eq("person_id", personId);
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }

  const filtered = people.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf?.includes(search)
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-primary"
          />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} docs</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum documento consultado disponível.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="bg-surface border border-surface-border rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-light transition-colors"
                onClick={() =>
                  setExpanded(expanded === person.id ? null : person.id)
                }
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-primary/10 flex items-center justify-center text-cyan-primary font-bold text-sm">
                    {person.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {person.name || "Nome não disponível"}
                    </p>
                    <p className="text-gray-500 text-xs font-mono">
                      CPF: {person.cpf}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsUsed(person.id);
                    }}
                    className="px-3 py-1.5 bg-success/10 text-success border border-success/30 rounded-lg text-xs font-medium hover:bg-success/20 transition-colors"
                  >
                    Marcar como Usado
                  </button>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      expanded === person.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === person.id && (
                <div className="px-5 pb-5 border-t border-surface-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

                  {/* Raw API data */}
                  {person.raw_data && (
                    <details className="mt-4">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                        Dados completos da API
                      </summary>
                      <pre className="mt-2 bg-black/50 rounded-lg p-3 text-xs text-gray-400 overflow-auto max-h-64 font-mono">
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
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <p className="text-gray-300">{value || "—"}</p>
    </div>
  );
}
