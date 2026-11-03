"use client";

import type { ReactNode } from "react";

export interface ShellTab<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  badge?: number | string;
  /** Frase curta embaixo do título grande. */
  subtitle?: string;
}

interface AppShellProps<T extends string> {
  role: string;
  userName: string;
  tabs: ShellTab<T>[];
  tab: T;
  onTab: (t: T) => void;
  onLogout: () => void;
  /** Ação principal da aba (fica ao lado do título grande). */
  actions?: ReactNode;
  children: ReactNode;
}

// Casca de app: barra superior translúcida com avatar, título grande da seção
// (estilo iOS), abas como segmented control no desktop e tab bar no celular.
export default function AppShell<T extends string>({ role, userName, tabs, tab, onTab, onLogout, actions, children }: AppShellProps<T>) {
  const atual = tabs.find((t) => t.value === tab);
  const iniciais = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="theme-ms min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[20px] font-black tracking-[-0.04em] leading-none text-white">
              RIK<span className="text-[#3d82ff]">O</span>
            </span>
            <span className="ms-pill"><b>{role}</b>painel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[13px] text-text-tertiary truncate max-w-[160px]">{userName}</span>
            <span
              className="w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center text-white"
              style={{ background: "linear-gradient(180deg, #003a93 0%, #005ce6 60%, #3d82ff 100%)", boxShadow: "0 0 0 1px rgba(0,92,230,.5), 0 0 18px -4px rgba(0,92,230,.6)" }}
              aria-hidden
            >
              {iniciais || "•"}
            </span>
            <button onClick={onLogout} className="btn-ghost !px-3 !py-1.5 !text-[13px] !rounded-full">
              Sair
            </button>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="mx-auto w-full max-w-4xl px-6 pb-3">
            <div className="segmented max-w-full overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.value} type="button" data-active={tab === t.value} onClick={() => onTab(t.value)}>
                  {t.label}
                  {t.badge !== undefined && t.badge !== 0 && <span className="ml-1.5 text-[11px] font-mono opacity-70">{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 pt-5 sm:pt-7 pb-28 sm:pb-12 flex flex-col gap-5">
        {/* Título grande da seção */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-none">
              <span className="ms-title">{atual?.label}</span>
              {atual?.badge !== undefined && atual.badge !== 0 && (
                <span className="ml-2 align-middle badge badge-primary text-[12px]">{atual.badge}</span>
              )}
            </h1>
            {atual?.subtitle && <p className="mt-1.5 text-[14px] text-text-tertiary">{atual.subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        {children}
      </main>

      <nav className="tabbar sm:hidden" aria-label="Seções">
        {tabs.map((t) => (
          <button key={t.value} type="button" data-active={tab === t.value} onClick={() => onTab(t.value)}>
            <span className="relative [&>svg]:w-[22px] [&>svg]:h-[22px]">
              {t.icon}
              {t.badge !== undefined && t.badge !== 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
