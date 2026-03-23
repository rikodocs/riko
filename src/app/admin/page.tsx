"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("riko_auth");
    if (auth === "true") {
      router.push("/admin/dashboard");
    }
    inputRefs.current[0]?.focus();
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      validatePin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setPin(pasted.split(""));
      validatePin(pasted);
    }
  };

  const validatePin = (fullPin: string) => {
    setLoading(true);
    setTimeout(() => {
      if (fullPin === "171033") {
        sessionStorage.setItem("riko_auth", "true");
        router.push("/admin/dashboard");
      } else {
        setError(true);
        setPin(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden noise">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center gap-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="text-5xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-primary">R</span>
            <span className="text-text-primary">IKO</span>
          </h1>
        </div>

        {/* Login card */}
        <div className="glass-static rounded-2xl p-8 flex flex-col items-center gap-6 min-w-[340px]">
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-text-secondary text-xs uppercase tracking-[0.2em] font-medium"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Acesso Restrito
            </p>
            <p className="text-text-tertiary text-xs">
              Digite o PIN de 6 dígitos
            </p>
          </div>

          {/* PIN Input */}
          <div className="flex gap-3" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                aria-label={`Dígito ${index + 1} do PIN`}
                className={`w-12 h-14 text-center text-xl font-mono rounded-xl bg-surface-1 border transition-all duration-200 pin-input ${
                  error
                    ? "border-danger text-danger glow-danger"
                    : "border-surface-border text-text-primary"
                } ${loading ? "opacity-40" : ""}`}
              />
            ))}
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              <p className="text-danger text-xs font-medium">
                Código inválido
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-text-tertiary text-xs">Verificando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
