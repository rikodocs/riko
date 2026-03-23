"use client";

import { useState } from "react";

export interface Person {
  id: string;
  cpf: string;
  name: string;
  birth_date: string;
  mother_name: string;
  profession: string;
  phones: string[];
  emails: string[];
  addresses: string[];
  city: string;
  state: string;
  // Legacy single fields (backward compat)
  phone?: string;
  email?: string;
  address?: string;
  score: string;
  income: string;
  raw_data: Record<string, unknown>;
  created_at: string;
}

interface PersonCardProps {
  person: Person;
  actionLabel: string;
  actionColor: "success" | "warning";
  onAction: (personId: string) => void;
  index: number;
}

export default function PersonCard({ person, actionLabel, actionColor, onAction, index }: PersonCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Merge legacy + new array fields
  const phones = person.phones?.length > 0 ? person.phones : (person.phone ? [person.phone] : []);
  const emails = person.emails?.length > 0 ? person.emails : (person.email ? [person.email] : []);
  const addresses = person.addresses?.length > 0 ? person.addresses : (person.address ? [person.address] : []);

  const actionColors = {
    success: "text-success !border-success/20 hover:!bg-success-muted",
    warning: "text-warning !border-warning/20 hover:!bg-warning-muted",
  };

  const avatarColors = {
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
  };

  return (
    <div className="glass-static rounded-2xl overflow-hidden stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-glass-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              actionColor === "warning" ? avatarColors.success : "bg-primary-muted text-primary"
            }`}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {person.name?.[0] || "?"}
          </div>
          <div>
            <p className="text-text-primary font-medium text-[13px]">
              {person.name || "Nome não disponível"}
            </p>
            <p className="text-text-disabled text-[11px] font-mono">
              CPF: {person.cpf}
              {person.profession && <span className="text-text-tertiary"> &middot; {person.profession}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(person.id); }}
            className={`btn-ghost !py-1.5 !px-3 !text-[11px] !rounded-lg ${actionColors[actionColor]}`}
          >
            {actionLabel}
          </button>
          <svg
            className={`w-4 h-4 text-text-disabled transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-border pt-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <InfoRow label="Nome" value={person.name} />
            <InfoRow label="CPF" value={person.cpf} />
            <InfoRow label="Data de Nascimento" value={person.birth_date} />
            <InfoRow label="Nome da Mãe" value={person.mother_name} />
            {person.profession && <InfoRow label="Profissão" value={person.profession} />}
            <InfoRow label="Cidade" value={person.city} />
            <InfoRow label="Estado" value={person.state} />
            <InfoRow label="Score" value={person.score} />
            <InfoRow label="Renda" value={person.income} />
          </div>

          {/* Telefones */}
          {phones.length > 0 && (
            <div className="mt-3">
              <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
                Telefones ({phones.length})
              </span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {phones.map((phone, i) => (
                  <span key={i} className="badge badge-primary font-mono text-[11px]">
                    {phone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Emails */}
          {emails.length > 0 && (
            <div className="mt-3">
              <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
                E-mails ({emails.length})
              </span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {emails.map((email, i) => (
                  <span key={i} className="badge badge-primary font-mono text-[11px]">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Endereços */}
          {addresses.length > 0 && (
            <div className="mt-3">
              <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
                Endereços ({addresses.length})
              </span>
              <div className="space-y-1.5 mt-1.5">
                {addresses.map((addr, i) => (
                  <div key={i} className="bg-surface-0 rounded-lg px-3 py-2 text-text-secondary text-[12px]">
                    {addr}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw data */}
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
