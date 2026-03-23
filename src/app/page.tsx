export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden noise">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Gradient orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-7xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-primary">R</span>
            <span className="text-text-primary">IKO</span>
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        {/* Status card */}
        <div className="glass-static rounded-2xl px-8 py-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span
              className="text-sm text-text-secondary uppercase tracking-[0.2em] font-medium"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Em Manutenção
            </span>
          </div>

          <p className="text-text-tertiary text-sm max-w-sm text-center leading-relaxed">
            Estamos realizando melhorias no sistema.
            <br />
            Voltaremos em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
