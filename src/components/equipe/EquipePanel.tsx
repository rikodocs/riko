"use client";

import { useState } from "react";
import { ContasRecebidas } from "./ContasRecebidas";
import { Produtos } from "./Produtos";
import { FinanceiroEquipe } from "./FinanceiroEquipe";
import { UploadContas } from "./UploadContas";
import { Operadores } from "./Operadores";
import { Modelos } from "./Modelos";

type Sub = "contas" | "operadores" | "modelos" | "financeiro" | "produtos" | "subir";

const ABAS: [Sub, string][] = [
  ["contas", "Contas recebidas"],
  ["operadores", "Operadores"],
  ["modelos", "Modelos"],
  ["financeiro", "Financeiro"],
  ["produtos", "Produtos"],
  ["subir", "Subir contas"],
];

// Moderador: recebe as contas da equipe, baixa pra subir na Mikey Ads, define
// taxas e registra o que pagou a cada operador.
export default function EquipePanel({ viewerId }: { viewerId: string }) {
  const [sub, setSub] = useState<Sub>("contas");
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 animate-fade-in">
      <div className="segmented self-start">
        {ABAS.map(([v, label]) => (
          <button key={v} type="button" onClick={() => setSub(v)} data-active={sub === v}>
            {label}
          </button>
        ))}
      </div>
      <div className="glass-static rounded-lg p-5">
        {sub === "contas" && <ContasRecebidas viewerId={viewerId} />}
        {sub === "operadores" && <Operadores viewerId={viewerId} />}
        {sub === "modelos" && <Modelos viewerId={viewerId} />}
        {sub === "financeiro" && <FinanceiroEquipe viewerId={viewerId} />}
        {sub === "produtos" && <Produtos viewerId={viewerId} />}
        {sub === "subir" && <UploadContas viewerId={viewerId} />}
      </div>
    </div>
  );
}
