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
    // Check if already authenticated
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

    // Auto-submit when all digits filled
    if (value && index === 5) {
      const fullPin = newPin.join("");
      validatePin(fullPin);
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
      const newPin = pasted.split("");
      setPin(newPin);
      validatePin(pasted);
    }
  };

  const validatePin = (fullPin: string) => {
    setLoading(true);
    // Small delay for visual feedback
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
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
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

      <div className="absolute w-64 h-64 rounded-full bg-cyan-primary opacity-10 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-5xl font-bold tracking-wider text-white">
          <span className="text-cyan-primary">R</span>IKO
        </div>

        <div className="text-sm text-gray-500 uppercase tracking-widest">
          Acesso Restrito
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
              className={`w-12 h-14 text-center text-xl font-mono rounded-lg bg-surface border-2 transition-all duration-200 pin-input ${
                error
                  ? "border-danger text-danger"
                  : "border-surface-border text-white"
              } ${loading ? "opacity-50" : ""}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-danger text-sm animate-pulse">
            Código inválido. Tente novamente.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-primary animate-ping" />
            <span className="text-gray-400 text-sm">Verificando...</span>
          </div>
        )}

        <div className="w-48 h-px bg-gradient-to-r from-transparent via-cyan-primary to-transparent opacity-30" />
        <p className="text-gray-600 text-xs">
          Digite o PIN de 6 dígitos para acessar
        </p>
      </div>
    </div>
  );
}
