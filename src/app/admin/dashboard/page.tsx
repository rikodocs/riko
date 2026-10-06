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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    withOperators: 0,
    downloaded: 0,
    rejectedMod: 0,
    total: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function count(apply: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
    const { count: c } = await apply(base());
    return c || 0;
  }

  function base() {
    return supabase.from("documents").select("id", { count: "exact", head: true });
  }

  async function loadStats() {
    // Fluxo: upload -> aguardando moderação -> aprovado (estoque) ->
    // com operador -> baixado. Recusado pelo moderador fica anotado à parte.
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass-static rounded-lg p-5 stagger-item"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p
              className="text-text-tertiary text-[11px] uppercase tracking-[0.1em] font-medium mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {card.label}
            </p>
            <p
              className={`text-3xl font-bold tracking-tight ${card.color}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-static rounded-lg p-6">
        <h2
          className="text-[15px] font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Como funciona agora
        </h2>
        <p className="text-text-tertiary text-xs mt-1 leading-relaxed">
          Envie os documentos em &quot;Imports&quot; — eles entram na fila de moderação. O
          moderador (código dele em <code>/</code>) digita o CPF, consulta, salva a pessoa e
          aprova ou recusa. Depois ele distribui os aprovados pros operadores, que recebem tudo
          pronto em <code>/operacao</code> e baixam.
        </p>
      </div>
    </div>
  );
}
