const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Centavos (int) -> "R$ 89,90". Normaliza espacos nao-quebraveis do Intl (U+00A0/U+202F). */
export function formatBRL(centavos: number): string {
  return BRL.format((centavos || 0) / 100).replace(/\s/g, " ");
}

/**
 * "89,90" | "R$ 89,90" | "1.234,56" | "89.90" -> centavos inteiros, ou null.
 * Regra: virgula = decimal (pt-BR). Sem virgula, um ponto com 3 digitos depois
 * e tratado como separador de milhar ("1.234" -> 1234).
 */
export function parsePrecoToCents(input: string): number | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/r\$\s*/i, "").replace(/\s/g, "");
  if (!s || /[^0-9.,]/.test(s)) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) s = s.replace(/\./g, "");
    else if (dots === 1 && s.split(".")[1].length === 3) s = s.replace(/\./g, "");
  }
  const value = Number(s);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
