"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  pending: number;
  consulted: number;
  used: number;
  total: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ pending: 0, consulted: 0, used: 0, total: 0 });
  const [consulting, setConsulting] = useState(false);
  const [consultLog, setConsultLog] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data: docs } = await supabase.from("documents").select("status");
    if (docs) {
      setStats({
        pending: docs.filter((d) => d.status === "pending").length,
        consulted: docs.filter((d) => d.status === "consulted").length,
        used: docs.filter((d) => d.status === "used").length,
        total: docs.length,
      });
    }
  }

  async function handleConsultar() {
    setConsulting(true);
    setConsultLog([]);
    setNotifications([]);

    try {
      const res = await fetch("/api/consultar", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setConsultLog([`Erro: ${data.error}`]);
        setConsulting(false);
        return;
      }

      setConsultLog(data.log || []);
      if (data.notifications?.length > 0) {
        setNotifications(data.notifications);
      }
      await loadStats();
    } catch {
      setConsultLog(["Erro ao conectar com o servidor."]);
    }

    setConsulting(false);
  }

  const statCards = [
    { label: "Pendentes", value: stats.pending, color: "text-warning" },
    { label: "Consultados", value: stats.consulted, color: "text-cyan-primary" },
    { label: "Usados", value: stats.used, color: "text-success" },
    { label: "Total", value: stats.total, color: "text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-surface-border rounded-xl p-5"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Consultar Button */}
      <div className="bg-surface border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Consultar Documentos</h2>
            <p className="text-sm text-gray-500">
              Processa documentos pendentes: extrai CPF via OCR e consulta na API
            </p>
          </div>
          <button
            onClick={handleConsultar}
            disabled={consulting || stats.pending === 0}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              consulting || stats.pending === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-cyan-primary text-black hover:bg-cyan-dark glow-cyan"
            }`}
          >
            {consulting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Consultando...
              </span>
            ) : (
              `Consultar (${stats.pending} pendentes)`
            )}
          </button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {notifications.map((note, i) => (
              <div
                key={i}
                className="bg-warning/10 border border-warning/30 text-warning px-4 py-2 rounded-lg text-sm"
              >
                {note}
              </div>
            ))}
          </div>
        )}

        {/* Console Log */}
        {consultLog.length > 0 && (
          <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
            {consultLog.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("Erro") || line.startsWith("[ERRO")
                    ? "text-danger"
                    : line.startsWith("[OK")
                    ? "text-success"
                    : line.startsWith("[AVISO") || line.startsWith("[DUPLICADO")
                    ? "text-warning"
                    : "text-gray-400"
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
