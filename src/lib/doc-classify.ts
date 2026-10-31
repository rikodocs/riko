export type DocCategory = "cnh_digital" | "rg_digital" | "outro";

const QR_CNH = ["senatran", "serpro", "denatran", "dnit.gov", "portalservicos", "servicos.dnit", "gov.br/cnh", "validacnh"];
const QR_RG = ["gov.br/cin", "gov.br/rg", "identidade", "icn.gov", "iin.gov", "cin.gov", "pfrg", "biometria", "carteira de identidade", "registro geral"];

// O QR da CNH/RG digital traz dados assinados, não URL — quem identifica o emissor é a camada de texto do PDF.
// Scans de documento físico não têm camada de texto, então isso só casa com PDFs digitais de verdade.
const TEXT_CNH = ["senatran", "carteira nacional de habilita", "assinador serpro"];
const TEXT_RG = ["carteira de identidade", "identidade nacional", "registro geral", "instituto de identifica"];

export function classifyByText(text: string): DocCategory | null {
  const t = text.toLowerCase();
  if (TEXT_CNH.some((p) => t.includes(p))) return "cnh_digital";
  if (TEXT_RG.some((p) => t.includes(p))) return "rg_digital";
  return null;
}

export function classifyDoc(qr: string | null, text: string): DocCategory {
  if (qr) {
    const q = qr.toLowerCase();
    if (QR_CNH.some((p) => q.includes(p))) return "cnh_digital";
    if (QR_RG.some((p) => q.includes(p))) return "rg_digital";
  }
  return classifyByText(text) || "outro";
}
