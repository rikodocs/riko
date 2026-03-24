"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface PersonDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
}

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
  used?: boolean;
  raw_data: Record<string, unknown>;
  created_at: string;
  documents?: PersonDocument[];
}

interface PersonCardProps {
  person: Person;
  actionLabel: string;
  actionColor: "success" | "warning";
  onAction: (personId: string) => void;
  onDocumentsChanged?: () => void;
  index: number;
}

export default function PersonCard({ person, actionLabel, actionColor, onAction, onDocumentsChanged, index }: PersonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [attachMsg, setAttachMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge legacy + new array fields
  const phones = person.phones?.length > 0 ? person.phones : (person.phone ? [person.phone] : []);
  const emails = person.emails?.length > 0 ? person.emails : (person.email ? [person.email] : []);
  const addresses = person.addresses?.length > 0 ? person.addresses : (person.address ? [person.address] : []);

  // Generate clean filename from person name: "JOAO SILVA LINO NETO" -> "JOAOSILVALINETONETO.pdf"
  const cleanName = (person.name || "documento")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9]/g, "") // remove spaces/special chars
    .toUpperCase();

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

          {/* Documentos */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-disabled text-[10px] uppercase tracking-wider font-medium">
                Documentos ({person.documents?.length || 0})
              </span>
              <div className="flex items-center gap-2">
                {attachMsg && (
                  <span className={`text-[10px] font-medium ${attachMsg.startsWith("!") ? "text-danger" : "text-success"}`}>
                    {attachMsg.replace(/^!/, "")}
                  </span>
                )}
                <label className={`btn-ghost !py-1 !px-2.5 !text-[10px] !rounded-lg text-primary !border-primary/20 hover:!bg-primary-muted cursor-pointer flex items-center gap-1.5 ${attaching ? "opacity-50 pointer-events-none" : ""}`}>
                  {attaching ? (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {attaching ? "Anexando..." : "Anexar Documento"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={attaching}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setAttaching(true);
                      setAttachMsg(null);
                      let ok = 0;
                      let errs = 0;
                      for (const file of Array.from(files)) {
                        try {
                          const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
                          const baseName = file.name
                            .replace(/\.[^.]+$/, "")
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-zA-Z0-9]/g, "_")
                            .replace(/_+/g, "_")
                            .replace(/^_|_$/g, "")
                            || "doc";
                          const fileName = `${Date.now()}_${baseName}.${ext}`;

                          const { error: uploadError } = await supabase.storage
                            .from("documents")
                            .upload(fileName, file);

                          if (uploadError) { errs++; continue; }

                          const { data: urlData } = supabase.storage
                            .from("documents")
                            .getPublicUrl(fileName);

                          const { error: insertError } = await supabase.from("documents").insert({
                            file_name: file.name,
                            file_path: fileName,
                            file_url: urlData.publicUrl,
                            file_type: file.type,
                            status: person.used ? "used" : "consulted",
                            cpf_extracted: person.cpf,
                            person_id: person.id,
                          });

                          if (insertError) errs++;
                          else ok++;
                        } catch { errs++; }
                      }
                      setAttaching(false);
                      if (ok > 0) {
                        setAttachMsg(`${ok} anexado(s)!`);
                        onDocumentsChanged?.();
                      } else {
                        setAttachMsg(`!Falha ao anexar`);
                      }
                      // Reset input
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setTimeout(() => setAttachMsg(null), 3000);
                    }}
                  />
                </label>
              </div>
            </div>
          {person.documents && person.documents.length > 0 && (
            <>
              <span className="hidden">
                {/* count already shown above */}
              </span>
              <div className="flex flex-wrap gap-3 mt-2">
                {person.documents.map((doc, di) => {
                  const ext = doc.file_name?.split(".").pop()?.toLowerCase() || "pdf";
                  const downloadName = `${cleanName}${person.documents!.length > 1 ? `_${di + 1}` : ""}.${ext}`;
                  const isPdf = doc.file_type === "application/pdf" || ext === "pdf";
                  const isImage = doc.file_type?.startsWith("image/");

                  return (
                    <div key={doc.id} className="bg-surface-0 rounded-xl border border-surface-border overflow-hidden w-[220px]">
                      {/* Preview */}
                      <div className="w-full h-[160px] bg-glass overflow-hidden">
                        {isImage ? (
                          <img
                            src={doc.file_url}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : isPdf ? (
                          <iframe
                            src={`${doc.file_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={doc.file_name}
                            className="w-full h-full border-0 pointer-events-none"
                            style={{ transform: "scale(1)", transformOrigin: "top left" }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Download bar */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await fetch(doc.file_url);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = downloadName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-primary hover:bg-glass-hover transition-colors border-t border-surface-border w-full text-left"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span className="truncate font-medium">{downloadName}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </div>

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
