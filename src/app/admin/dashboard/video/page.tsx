"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type JobStatus = "queued" | "processing" | "completed" | "failed";

type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  resultUrl?: string;
  createdAt: string;
  videoName: string;
  photoName: string;
};

type Settings = {
  resolution: string;
  steps: number;
  seed: number;
  lipSync: boolean;
  hatFix: boolean;
  fixFaces: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  resolution: "720p",
  steps: 6,
  seed: -1,
  lipSync: true,
  hatFix: false,
  fixFaces: true,
};

async function api(body: Record<string, unknown>) {
  const r = await fetch("/api/video-ia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default function VideoIAPage() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    api({ action: "status" }).then((r) => setOnline(r.online ?? false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const pickVideo = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) return;
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  }, []);

  const pickPhoto = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }, []);

  const drop = useCallback(
    (e: React.DragEvent, kind: "video" | "photo") => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) kind === "video" ? pickVideo(f) : pickPhoto(f);
    },
    [pickVideo, pickPhoto]
  );

  const clearVideo = () => { setVideoFile(null); setVideoPreview(null); };
  const clearPhoto = () => { setPhotoFile(null); setPhotoPreview(null); };

  const generate = async () => {
    if (!videoFile || !photoFile) return;
    setGenerating(true);
    setError(null);
    setProgress(0);
    setStatusText("Enviando arquivos...");

    try {
      const ts = Date.now();
      const vPath = `video-ia/${ts}_v_${videoFile.name}`;
      const pPath = `video-ia/${ts}_p_${photoFile.name}`;

      const [vUp, pUp] = await Promise.all([
        supabase.storage.from("documents").upload(vPath, videoFile),
        supabase.storage.from("documents").upload(pPath, photoFile),
      ]);
      if (vUp.error || pUp.error) throw new Error("Falha no upload dos arquivos.");

      const videoUrl = supabase.storage.from("documents").getPublicUrl(vPath).data.publicUrl;
      const photoUrl = supabase.storage.from("documents").getPublicUrl(pPath).data.publicUrl;

      setStatusText("Iniciando geracao...");
      const res = await api({ action: "generate", videoUrl, photoUrl, settings });
      if (res.error) throw new Error(res.error);

      const jobId = res.jobId || res.id;
      if (!jobId) throw new Error("Nenhum job retornado pelo OpenJutsu.");

      setStatusText("Processando video...");
      pollRef.current = setInterval(async () => {
        try {
          const s = await api({ action: "job-status", jobId });
          if (s.progress) setProgress(s.progress);
          if (s.status === "processing") setStatusText(`Gerando video... ${s.progress || 0}%`);
          if (s.status === "completed") {
            clearInterval(pollRef.current!);
            setGenerating(false);
            setProgress(100);
            setStatusText("Concluido!");
            setJobs((prev) => [{
              id: jobId, status: "completed",
              resultUrl: s.resultUrl || s.output_url,
              createdAt: new Date().toISOString(),
              videoName: videoFile.name, photoName: photoFile.name,
              progress: 100,
            }, ...prev]);
          } else if (s.status === "failed") {
            clearInterval(pollRef.current!);
            setGenerating(false);
            setError("A geracao falhou. Tente novamente.");
          }
        } catch { /* retry next tick */ }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setGenerating(false);
    }
  };

  /* -------- render helpers -------- */

  const Dot = ({ state }: { state: boolean | null }) => (
    <span className={`w-2 h-2 rounded-full inline-block ${
      state === null ? "bg-text-disabled animate-pulse" : state ? "bg-success" : "bg-danger"
    }`} />
  );

  const UploadCard = ({ kind, file, preview, onPick, onClear, inputRef }: {
    kind: "video" | "photo";
    file: File | null;
    preview: string | null;
    onPick: (f: File) => void;
    onClear: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => drop(e, kind)}
      onClick={() => inputRef.current?.click()}
      className="glass-static rounded-2xl overflow-hidden cursor-pointer group hover:ring-1 hover:ring-primary/30 transition-all duration-300"
    >
      {preview ? (
        <div className="relative aspect-video bg-black">
          {kind === "video" ? (
            <video src={preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-danger hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white text-xs font-medium truncate drop-shadow-lg">{file?.name}</p>
          </div>
        </div>
      ) : (
        <div className="aspect-video flex flex-col items-center justify-center gap-3 group-hover:bg-primary-muted/5 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-glass flex items-center justify-center group-hover:bg-primary-muted group-hover:scale-105 transition-all duration-300">
            {kind === "video" ? (
              <svg className="w-7 h-7 text-text-disabled group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-text-disabled group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-text-secondary">
              {kind === "video" ? "Video de Referencia" : "Foto da Pessoa"}
            </p>
            <p className="text-[11px] text-text-disabled mt-1">
              {kind === "video" ? "O video com os movimentos" : "A pessoa que vai aparecer no video"}
            </p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={kind === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Video IA
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-primary-muted text-primary text-[10px] font-bold uppercase tracking-wider">
              Beta
            </span>
          </div>
          <p className="text-text-tertiary text-[13px]">
            Substitua a pessoa de um video pela foto de referencia usando IA
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass text-[11px] font-medium text-text-secondary shrink-0">
          <Dot state={online} />
          {online === null ? "Verificando..." : online ? "OpenJutsu conectado" : "OpenJutsu offline"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-glass rounded-lg w-fit">
        {([["generate", "Gerar"], ["history", "Historico"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
              tab === k ? "bg-primary text-on-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <div className="space-y-5">
          {/* Upload cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UploadCard kind="video" file={videoFile} preview={videoPreview} onPick={pickVideo} onClear={clearVideo} inputRef={videoRef} />
            <UploadCard kind="photo" file={photoFile} preview={photoPreview} onPick={pickPhoto} onClear={clearPhoto} inputRef={photoRef} />
          </div>

          {/* Flow visualization */}
          {videoFile && photoFile && (
            <div className="flex items-center justify-center gap-3 py-1 animate-fade-in">
              <span className="text-xs text-text-disabled">Movimentos</span>
              <svg className="w-4 h-4 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
              </svg>
              <span className="px-3 py-1 rounded-full bg-primary-muted text-primary text-xs font-medium">
                + Aparencia
              </span>
              <svg className="w-4 h-4 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span className="text-xs font-medium text-primary">Video Final</span>
            </div>
          )}

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showSettings ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Configuracoes avancadas
          </button>

          {/* Settings panel */}
          {showSettings && (
            <div className="glass-static rounded-xl p-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Resolution */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Resolucao</label>
                  <div className="flex gap-1.5">
                    {["480p", "720p", "1080p"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setSettings((s) => ({ ...s, resolution: r }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          settings.resolution === r ? "bg-primary text-on-primary" : "bg-glass text-text-tertiary hover:text-text-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-text-secondary">Steps</label>
                    <span className="text-xs font-mono text-text-disabled">{settings.steps}</span>
                  </div>
                  <input type="range" min={1} max={20} value={settings.steps}
                    onChange={(e) => setSettings((s) => ({ ...s, steps: +e.target.value }))}
                    className="w-full accent-primary h-1.5"
                  />
                </div>

                {/* Seed */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Seed</label>
                  <input type="number" value={settings.seed}
                    onChange={(e) => setSettings((s) => ({ ...s, seed: +e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-glass border border-surface-border text-sm text-text-primary focus:outline-none focus:border-primary/40"
                    placeholder="-1 = aleatorio"
                  />
                </div>

                {/* Toggles */}
                {([
                  ["lipSync", "Lip Sync", "Sincroniza os labios"],
                  ["fixFaces", "Fix Faces", "Corrige rostos"],
                  ["hatFix", "Hat Fix", "Preserva chapeus"],
                ] as const).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-text-secondary">{label}</p>
                      <p className="text-[10px] text-text-disabled">{desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${settings[key] ? "bg-primary" : "bg-surface-border"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {generating && (
            <div className="glass-static rounded-xl p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-muted flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{statusText}</p>
                    <p className="text-[11px] text-text-disabled">Isso pode levar alguns minutos</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-primary font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-muted border border-danger/20 animate-fade-in">
              <svg className="w-4 h-4 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-danger flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-danger/50 hover:text-danger">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!videoFile || !photoFile || generating || !online}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Gerar Video
              </>
            )}
          </button>

          {/* Offline notice */}
          {online === false && (
            <div className="glass-static rounded-xl p-5 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-warning-muted flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">OpenJutsu nao esta rodando</p>
              <p className="text-xs text-text-tertiary mb-4">
                Para gerar videos, inicie o OpenJutsu na sua maquina local.
              </p>
              <div className="bg-glass rounded-lg p-4 text-left">
                <p className="text-[11px] font-medium text-text-secondary mb-2">Como iniciar:</p>
                <div className="space-y-1.5 text-[11px] text-text-tertiary font-mono">
                  <p>1. git clone https://github.com/D3voz/openjutsu</p>
                  <p>2. cd openjutsu</p>
                  <p>3. docker compose up</p>
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          {!generating && online !== false && (
            <div className="glass-static rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Como funciona
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z", title: "1. Video", text: "Envie um video com uma pessoa em movimento" },
                  { icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0", title: "2. Foto", text: "Envie a foto da pessoa que quer colocar no video" },
                  { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", title: "3. Magia", text: "A IA rastreia os movimentos e gera um novo video" },
                ].map(({ icon, title, text }) => (
                  <div key={title} className="flex flex-col items-center text-center gap-2 p-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-text-primary">{title}</p>
                    <p className="text-[11px] text-text-tertiary leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History */
        <div className="glass-static rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Videos Gerados
            </h3>
            <span className="text-[11px] text-text-disabled">{jobs.length} video{jobs.length !== 1 ? "s" : ""}</span>
          </div>
          {jobs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-glass flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 12 6 12.504 6 13.125" />
                </svg>
              </div>
              <p className="text-sm text-text-tertiary">Nenhum video gerado ainda</p>
              <p className="text-[11px] text-text-disabled mt-1">Gere seu primeiro video na aba &ldquo;Gerar&rdquo;</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {jobs.map((job, i) => (
                <div key={job.id} className="px-5 py-4 flex items-center justify-between hover:bg-glass-hover transition-colors stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      job.status === "completed" ? "bg-success-muted" : job.status === "failed" ? "bg-danger-muted" : "bg-warning-muted"
                    }`}>
                      {job.status === "completed" ? (
                        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : job.status === "failed" ? (
                        <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-text-primary truncate">{job.videoName}</p>
                      <p className="text-[11px] text-text-disabled truncate">
                        {job.photoName} &middot; {new Date(job.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {job.status === "completed" && job.resultUrl && (
                    <a href={job.resultUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:shadow-md transition-all shrink-0 ml-3"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Baixar
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
