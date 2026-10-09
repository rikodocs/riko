import type { ContaRow } from "@/lib/contas/types";

/** Limite de caracteres por célula do Excel (.xlsx). Cookie que bate nisso foi truncado. */
export const EXCEL_CELL_MAX = 32767;

/**
 * Cookie QUEBRADO/inutilizável — a conta não presta pra venda com ele assim. Dois
 * casos: (1) o Excel na ORIGEM (AdsPower→planilha) trocou o cookie gigante pela
 * mensagem de erro ("Cookie too large and exceeds Excel's grid limits"); (2) o
 * cookie foi TRUNCADO no limite de célula (>= 32767 chars) → JSON cortado, inválido.
 * Cookie VAZIO não é tratado aqui (pode ser caso legítimo) — só o comprovadamente quebrado.
 */
export function cookieQuebrado(cookie: string | null | undefined): boolean {
  const c = (cookie ?? "").trim();
  if (!c) return false;
  if (/cookie too large|exceeds excel|grid limit/i.test(c)) return true;
  return c.length >= EXCEL_CELL_MAX; // truncado pelo Excel
}

/** Formata um CNPJ de 14 dígitos como 00.000.000/0001-00; senão devolve o texto cru (trim). */
export function formatCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 14) return raw.trim();
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Mapeia registros do Excel (chaves = cabeçalhos já em minúsculo) para ContaRow.
 * Pula linhas vazias (sem id/acc_id/username E sem username). Idempotência via source_key.
 */
/** Campos do export que têm coluna no import e a gente reemite fiel (geo/proxy). */
const CAMPOS_IMPORT_EXTRA = [
  "platform", "proxytype", "ipchecker", "proxyurl", "proxyid", "ip", "countrycode",
] as const;

export function mapRows(records: Record<string, unknown>[]): ContaRow[] {
  const out: ContaRow[] = [];
  for (const rec of records) {
    const login = String(rec.username ?? "").trim();
    const source_key = String(rec.id ?? rec.acc_id ?? rec.username ?? "").trim();
    if (source_key === "" && login === "") continue; // linha em branco
    const import_extra: Record<string, string> = {};
    for (const k of CAMPOS_IMPORT_EXTRA) {
      const v = String(rec[k] ?? "").trim();
      if (v) import_extra[k] = v;
    }
    out.push({
      source_key,
      cnpj: formatCnpj(String(rec.remark ?? "")),
      login,
      senha: String(rec.password ?? ""),
      dois_fatores: String(rec.fakey ?? "").trim(),
      cookies: String(rec.cookie ?? ""),
      proxy: String(rec.proxy ?? "").trim(),
      ua: String(rec.ua ?? "").trim(),
      import_extra,
    });
  }
  return out;
}
