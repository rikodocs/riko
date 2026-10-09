"use client";

import { useState } from "react";
import { TesteGerador } from "@/components/ia/TesteGerador";
import { OpcAntigaGerador } from "@/components/ia/OpcAntigaGerador";
import { CasosOpc } from "@/components/ia/CasosOpc";

type Sub = "gerador" | "antiga" | "casos";

const ABAS: [Sub, string][] = [
  ["gerador", "Testar gerador"],
  ["antiga", "OPC Antiga"],
  ["casos", "Casos OPC"],
];

// Ferramentas de OPC trazidas da Mikey Ads — mesma tela pra moderador e operador.
export default function FerramentasPanel({ viewerId }: { viewerId: string }) {
  const [sub, setSub] = useState<Sub>("gerador");
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 animate-fade-in">
      <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1 self-start">
        {ABAS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setSub(v)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              sub === v ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="glass-static rounded-lg p-5">
        {sub === "gerador" && <TesteGerador viewerId={viewerId} />}
        {sub === "antiga" && <OpcAntigaGerador viewerId={viewerId} />}
        {sub === "casos" && <CasosOpc viewerId={viewerId} />}
      </div>
    </div>
  );
}
