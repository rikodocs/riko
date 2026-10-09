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
      <div className="segmented self-start">
        {ABAS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setSub(v)}
            data-active={sub === v}
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
