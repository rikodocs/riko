"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  available: number;
  rejected: number;
  used: number;
  total: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ available: 0, rejected: 0, used: 0, total: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: availableCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "available");

    const { count: rejectedCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected");

    const { count: usedCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "used");

    const available = availableCount || 0;
    const rejected = rejectedCount || 0;
    const used = usedCount || 0;

    setStats({ available, rejected, used, total: available + rejected + used });
  }

  const statCards = [
    { label: "Disponíveis", value: stats.available, color: "text-warning" },
    { label: "Rejeitados", value: stats.rejected, color: "text-danger" },
    { label: "Usados", value: stats.used, color: "text-success" },
    { label: "Total", value: stats.total, color: "text-text-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          Envie os documentos em &quot;Imports&quot; — eles ficam disponíveis automaticamente,
          sem nenhum processamento automático. Em &quot;Usuários&quot;, atribua documentos
          disponíveis a um usuário: ele revisa pelo código dele em <code>/</code>, e cada
          documento vira &quot;Usado&quot; (CPF confirmado e pessoa cadastrada) ou &quot;Rejeitado&quot;.
        </p>
      </div>
    </div>
  );
}
