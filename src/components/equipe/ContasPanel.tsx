"use client";

import { useState } from "react";
import { UploadContas } from "./UploadContas";
import { MeusEnvios } from "./MeusEnvios";
import { FinanceiroOperador } from "./FinanceiroOperador";

type Sub = "subir" | "envios" | "financeiro";

const ABAS: [Sub, string][] = [
  ["subir", "Subir contas"],
  ["envios", "Meus envios"],
  ["financeiro", "Financeiro"],
];

// Operador: sobe a planilha, acompanha o que subiu e o que tem a receber.
export default function ContasPanel({ viewerId }: { viewerId: string }) {
  const [sub, setSub] = useState<Sub>("subir");
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 animate-fade-in">
      <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1 self-start">
        {ABAS.map(([v, label]) => (
          <button key={v} type="button" onClick={() => setSub(v)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${sub === v ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="glass-static rounded-lg p-5">
        {sub === "subir" && <UploadContas viewerId={viewerId} onEnviou={() => setRefreshKey((k) => k + 1)} />}
        {sub === "envios" && <MeusEnvios viewerId={viewerId} refreshKey={refreshKey} />}
        {sub === "financeiro" && <FinanceiroOperador viewerId={viewerId} refreshKey={refreshKey} />}
      </div>
    </div>
  );
}
