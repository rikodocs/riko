"use client";

import type { ReactNode } from "react";

export interface ShellTab<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  badge?: number | string;
}

interface AppShellProps<T extends string> {
  role: string;
  userName: string;
  tabs: ShellTab<T>[];
  tab: T;
  onTab: (t: T) => void;
  onLogout: () => void;
  /** Conteúdo extra à direita do seletor de abas (desktop) / abaixo (celular). */
  actions?: ReactNode;
  children: ReactNode;
}

// Casca das telas de Operação e Moderador: cabeçalho fixo, abas como
// "segmented control" no desktop e tab bar inferior no celular.
export default function AppShell<T extends string>({ role, userName, tabs, tab, onTab, onLogout, actions, children }: AppShellProps<T>) {
  const iniciais = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-surface-border">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              <span className="text-primary">R</span>IKO
            </span>
            <span className="badge badge-primary text-[10px]">{role}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[13px] text-text-tertiary truncate max-w-[160px]">{userName}</span>
            <span className="w-8 h-8 rounded-full bg-primary-muted text-primary text-xs font-bold flex items-center justify-center" aria-hidden>
              {iniciais || "•"}
            </span>
            <button onClick={onLogout} className="btn-ghost !px-3 !py-1.5 !text-[13px]">
              Sair
            </button>
          </div>
        </div>
        {/* Abas no desktop */}
        <div className="hidden sm:block">
          <div className="mx-auto w-full max-w-3xl px-6 pb-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="segmented max-w-full overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.value} type="button" data-active={tab === t.value} onClick={() => onTab(t.value)}>
                  {t.label}
                  {t.badge !== undefined && t.badge !== 0 && (
                    <span className="ml-1.5 text-[11px] font-mono opacity-70">{t.badge}</span>
                  )}
                </button>
              ))}
            </div>
            {actions}
          </div>
        </div>
      </header>

      {/* Ações no celular (ficam logo abaixo do cabeçalho) */}
      {actions && (
        <div className="sm:hidden mx-auto w-full max-w-3xl px-4 pt-3 flex justify-end">
          {actions}
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-10 flex flex-col gap-4">
        {children}
      </main>

      {/* Tab bar no celular */}
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
