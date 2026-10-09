"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import AppShell, { type ShellTab } from "@/components/AppShell";
import { FiInbox, FiDownload, FiGlobe, FiTool, FiUpload, FiBookmark, FiFileText, FiChevronRight, FiUser } from "react-icons/fi";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";
import SitesPanel from "@/components/SitesPanel";
import FerramentasPanel from "@/components/ia/FerramentasPanel";
import ContasPanel from "@/components/equipe/ContasPanel";
import { ModelosOperador } from "@/components/equipe/ModelosOperador";
import { getViewerSession, clearViewerSession, homeForRole, type ViewerSession } from "@/lib/viewer-session";

interface PersonData {
  id: string;
  cpf: string;
  name: string | null;
  birth_date: string | null;
  mother_name: string | null;
  profession: string | null;
  phones: string[] | null;
  emails: string[] | null;
  addresses: string[] | null;
  city: string | null;
  state: string | null;
  score: string | null;
  income: string | null;
}

interface OpDoc {
  id: string;
  file_name: string;
  file_type: string | null;
  status: "available" | "downloaded";
  assigned_at: string | null;
  downloaded_at: string | null;
  person: PersonData | null;
}

type Tab = "novos" | "baixados" | "sites" | "ferramentas" | "contas" | "modelos";

function formatCpf(cpf: string) {
  const d = (cpf || "").replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

function safeName(name: string | null | undefined, fallback: string) {
  const clean = (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
  return clean || fallback;
}

function extOf(doc: OpDoc) {
  const fromName = doc.file_name?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  if (doc.file_type === "application/pdf") return "pdf";
  return (doc.file_type || "").split("/")[1] || "bin";
}

// Lista de campos (label + valor) usada tanto na tela quanto no .txt
function personFields(p: PersonData): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [
    { label: "Nome", value: p.name || "" },
    { label: "CPF", value: formatCpf(p.cpf) },
    { label: "Nascimento", value: p.birth_date || "" },
    { label: "Mãe", value: p.mother_name || "" },
    { label: "Profissão", value: p.profession || "" },
  ];
  (p.phones || []).forEach((v, i) => fields.push({ label: `Telefone ${i + 1}`, value: v }));
  (p.emails || []).forEach((v, i) => fields.push({ label: `E-mail ${i + 1}`, value: v }));
  (p.addresses || []).forEach((v, i) => fields.push({ label: `Endereço ${i + 1}`, value: v }));
  fields.push({ label: "Cidade/UF", value: [p.city, p.state].filter(Boolean).join(" / ") });
  fields.push({ label: "Score", value: p.score || "" });
  fields.push({ label: "Renda", value: p.income || "" });
  return fields.filter((f) => f.value);
}

function buildTxt(p: PersonData) {
  return personFields(p)
    .map((f) => `${f.label}: ${f.value}`)
    .join("\r\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sem clipboard (http sem https etc.) — o texto continua selecionável
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${label}`}
      title={copied ? "Copiado!" : `Copiar ${label}`}
      className={`shrink-0 w-7 h-7 rounded flex items-center justify-center border transition-colors ${
        copied
          ? "border-success/50 text-success bg-success/10"
          : "border-surface-border text-text-tertiary hover:text-primary hover:border-primary/50"
      }`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function OperacaoPage() {
  const router = useRouter();
  const [session, setSession] = useState<ViewerSession | null>(null);
  const [tab, setTab] = useState<Tab>("novos");
  const [docs, setDocs] = useState<OpDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "zip" | doc.id
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  const loadDocs = useCallback(async (viewerId: string) => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, file_name, file_type, status, assigned_at, downloaded_at, person:people(id, cpf, name, birth_date, mother_name, profession, phones, emails, addresses, city, state, score, income)"
      )
      .eq("assigned_to", viewerId)
      .in("status", ["available", "downloaded"])
      .order("assigned_at", { ascending: true });
    if (error) {
      setLoadError("Não foi possível carregar seus documentos. Tente novamente.");
      setDocs([]);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDocs(((data as any[]) || []).map((d) => ({ ...d, person: Array.isArray(d.person) ? d.person[0] ?? null : d.person })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getViewerSession();
    if (!s) {
      router.push("/");
      return;
    }
    if (s.role !== "operador") {
      router.push(homeForRole(s.role));
      return;
    }
    setSession(s);
    loadDocs(s.id);
  }, [router, loadDocs]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  function handleLogout() {
    clearViewerSession();
    router.push("/");
  }

  const novos = docs.filter((d) => d.status === "available");
  const baixados = docs.filter((d) => d.status === "downloaded");
  const list = tab === "novos" ? novos : baixados;

  function docUrl(doc: OpDoc) {
    return `/api/documento/${doc.id}?viewerId=${session?.id}`;
  }

  async function fetchDocBlob(doc: OpDoc) {
    const res = await fetch(docUrl(doc));
    if (!res.ok) throw new Error(`Falha ao baixar ${doc.file_name}`);
    return res.blob();
  }

  async function markDownloaded(ids: string[]) {
    if (!session) return;
    const res = await fetch("/api/operacao/baixado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId: session.id, documentIds: ids }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Baixou, mas não conseguiu marcar como baixado.");
    }
    loadDocs(session.id);
  }

  function handleTxt(doc: OpDoc) {
    if (!doc.person) return;
    const blob = new Blob([buildTxt(doc.person)], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${safeName(doc.person.name, formatCpf(doc.person.cpf))}.txt`);
  }

  async function handleDownloadOne(doc: OpDoc) {
    setBusy(doc.id);
    setMsg(null);
    try {
      const blob = await fetchDocBlob(doc);
      const base = safeName(doc.person?.name, doc.person ? formatCpf(doc.person.cpf) : doc.id.slice(0, 8));
      triggerDownload(blob, `${base}.${extOf(doc)}`);
      if (doc.status === "available") await markDownloaded([doc.id]);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao baixar." });
    } finally {
      setBusy(null);
    }
  }

  // ZIP com todos os novos: cada documento + um .txt com os dados da pessoa
  async function handleDownloadAll() {
    if (novos.length === 0) return;
    setBusy("zip");
    setMsg(null);
    try {
      const zip = new JSZip();
      const used = new Set<string>();
      const okIds: string[] = [];
      for (const doc of novos) {
        try {
          const blob = await fetchDocBlob(doc);
          let base = safeName(doc.person?.name, doc.person ? formatCpf(doc.person.cpf) : doc.id.slice(0, 8));
          for (let i = 2; used.has(base.toLowerCase()); i++) base = `${base}_${i}`;
          used.add(base.toLowerCase());
          zip.file(`${base}.${extOf(doc)}`, blob);
          if (doc.person) zip.file(`${base}.txt`, buildTxt(doc.person));
          okIds.push(doc.id);
        } catch {
          // Esse fica de fora e continua em "Novos"
        }
      }
      if (okIds.length === 0) throw new Error("Não foi possível baixar nenhum arquivo.");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}`;
      triggerDownload(zipBlob, `${okIds.length}docs${stamp}.zip`);
      await markDownloaded(okIds);
      const skipped = novos.length - okIds.length;
      setMsg({
        type: "success",
        text: `${okIds.length} documento(s) baixado(s)${skipped ? ` — ${skipped} falharam e continuam em Novos` : ""}.`,
      });
      setTab("baixados");
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro ao gerar ZIP." });
    } finally {
      setBusy(null);
    }
  }

  if (!session) return null;

  const tabs: ShellTab<Tab>[] = [
    { value: "novos", label: "Novos", icon: <FiInbox />, badge: novos.length, subtitle: "Documentos que o moderador enviou pra você" },
    { value: "baixados", label: "Baixados", icon: <FiDownload />, subtitle: "O que você já baixou" },
    { value: "contas", label: "Contas", icon: <FiUpload />, subtitle: "Suba a planilha e acompanhe seus envios" },
    { value: "modelos", label: "Modelos", icon: <FiBookmark />, subtitle: "Palavras-chave, títulos e descrições prontos" },
    { value: "sites", label: "Sites", icon: <FiGlobe />, subtitle: "Pegue o próximo CNPJ + URL da fila" },
    { value: "ferramentas", label: "Ferramentas", icon: <FiTool />, subtitle: "Gerador de site e respostas OPC" },
  ];

  const acoes =
    tab === "novos" && novos.length > 0 ? (
      <button onClick={handleDownloadAll} disabled={busy !== null} className="btn-primary !py-2 !px-4 !text-[13px]">
        {busy === "zip" ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            Gerando ZIP...
          </>
        ) : (
          `Baixar tudo (${novos.length}) em ZIP`
        )}
      </button>
    ) : undefined;

  return (
    <AppShell role="Operação" userName={session.name} tabs={tabs} tab={tab} onTab={setTab} onLogout={handleLogout} actions={acoes}>
      <div className="w-full flex flex-col gap-4">
        {msg && (
          <div
            className={`rounded-md border px-4 py-2 text-xs font-medium animate-fade-in ${
              msg.type === "success"
                ? "border-success/40 bg-success/10 text-success"
                : "border-danger/40 bg-danger-muted text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}

        {tab === "modelos" ? (
          <div className="w-full max-w-3xl animate-fade-in">
            <ModelosOperador viewerId={session.id} />
          </div>
        ) : tab === "contas" ? (
          <ContasPanel viewerId={session.id} />
        ) : tab === "ferramentas" ? (
          <FerramentasPanel viewerId={session.id} />
        ) : tab === "sites" ? (
          <SitesPanel viewerId={session.id} canEdit={false} />
        ) : loading ? (
          <p className="text-text-tertiary text-sm text-center mt-10">Carregando...</p>
        ) : loadError ? (
          <div className="glass-static rounded-lg p-8 text-center">
            <p className="text-danger font-medium mb-3">{loadError}</p>
            <button onClick={() => loadDocs(session.id)} className="btn-ghost text-xs">
              Tentar de novo
            </button>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === "novos" ? <FiInbox /> : <FiDownload />}
            title={tab === "novos" ? "Nenhum documento novo" : "Nada baixado ainda"}
            text={tab === "novos" ? "Quando o moderador enviar documentos pra você, eles aparecem aqui." : "Os documentos que você baixar ficam guardados aqui."}
          />
        ) : (
          list.map((doc) => {
            const fields = doc.person ? personFields(doc.person) : [];
            const isOpen = openDoc === doc.id;
            const isImage = (doc.file_type || "").startsWith("image/");
            const nome = doc.person?.name || "Pessoa sem nome";
            const iniciais = nome.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
            return (
              <article key={doc.id} className="glass-static overflow-hidden animate-fade-in">
                {/* Cabeçalho: avatar, nome, CPF */}
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <span className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[13px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #2a93ff, #5e5ce6)" }}>
                    {iniciais || <FiUser />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[17px] font-bold text-text-primary truncate">{nome}</h3>
                    <p className="text-[12px] text-text-tertiary font-mono mt-0.5 truncate">
                      {doc.person ? formatCpf(doc.person.cpf) : "Sem dados vinculados"}
                      {doc.status === "downloaded" && doc.downloaded_at && <> · baixado {new Date(doc.downloaded_at).toLocaleDateString("pt-BR")}</>}
                    </p>
                  </div>
                  <span className={`badge ${doc.status === "downloaded" ? "badge-success" : "badge-primary"}`}>{doc.status === "downloaded" ? "Baixado" : "Novo"}</span>
                </div>

                {/* Campos copiáveis em grade */}
                {fields.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-border border-y border-surface-border">
                    {fields.map((f) => (
                      <div key={f.label} className="flex items-center gap-2 bg-surface-0 px-4 py-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="eyebrow !text-[10px]">{f.label}</div>
                          <div className="text-[14px] text-text-primary break-words select-all mt-0.5">{f.value}</div>
                        </div>
                        <CopyButton value={f.value} label={f.label} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 sm:px-5 pb-2 text-[13px] text-text-tertiary">Aprovado só com o CPF — os dados completos ainda não estão disponíveis.</p>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2 p-3 sm:p-4">
                  <button type="button" onClick={() => setOpenDoc(isOpen ? null : doc.id)} className="btn-ghost flex-1 !justify-between !px-4">
                    <span className="flex items-center gap-2 text-[14px]"><FiFileText className="text-text-tertiary" /> {isOpen ? "Ocultar documento" : "Ver documento"}</span>
                    <FiChevronRight className={`text-text-tertiary transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {doc.person && (
                    <button onClick={() => handleTxt(doc)} className="btn-ghost !px-3" title="Baixar .txt com os dados" aria-label="Baixar .txt">
                      .txt
                    </button>
                  )}
                  <button onClick={() => handleDownloadOne(doc)} disabled={busy !== null} className="btn-primary !px-4">
                    <FiDownload /> {busy === doc.id ? "Baixando..." : "Baixar"}
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-surface-border bg-black">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={docUrl(doc)} alt="Documento" className="w-full h-auto block" />
                    ) : (
                      <iframe src={docUrl(doc)} title="Documento" className="w-full h-[70vh] block" />
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
