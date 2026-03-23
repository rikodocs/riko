"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PersonCard, { Person } from "@/components/PersonCard";

export default function DocsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF..." className="input-base w-full pl-10" />
        </div>
        <span className="text-[11px] text-text-disabled font-mono">{filtered.length} docs</span>
      </div>

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
          {filtered.map((person, i) => (
            <PersonCard
              key={person.id}
              person={person}
              actionLabel="Marcar como Usado"
              actionColor="success"
              onAction={markAsUsed}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
