import type { ReactNode } from "react";

// Estado vazio com ícone, título e explicação — em vez de uma linha solta.
export default function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="glass-static p-8 sm:p-10 text-center flex flex-col items-center gap-3 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-primary-muted text-primary flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      <p className="text-[17px] font-bold text-text-primary">{title}</p>
      {text && <p className="text-[14px] text-text-tertiary max-w-sm leading-relaxed">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
