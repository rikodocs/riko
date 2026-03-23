export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Glow orb behind logo */}
      <div className="absolute w-64 h-64 rounded-full bg-cyan-primary opacity-10 blur-[100px]" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-6xl font-bold tracking-wider text-white">
          <span className="text-cyan-primary">R</span>IKO
        </div>

        {/* Maintenance message */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-primary animate-pulse-glow" />
            <span className="text-lg text-gray-400 uppercase tracking-widest">
              Em Manutenção
            </span>
            <div className="w-3 h-3 rounded-full bg-cyan-primary animate-pulse-glow" />
          </div>

          <p className="text-gray-500 text-sm max-w-md text-center">
            Estamos realizando melhorias no sistema. Voltaremos em breve.
          </p>
        </div>

        {/* Decorative line */}
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-cyan-primary to-transparent opacity-50" />
      </div>
    </div>
  );
}
