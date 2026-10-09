import ExcelJS from "exceljs";
import { mapRows } from "@/lib/contas/mapping";
import type { ContaRow } from "@/lib/contas/types";

/** Extrai texto plano de uma célula exceljs (lida com hyperlink/fórmula/richText). */
function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.text === "string") return v.text;
    if (typeof v.result === "string" || typeof v.result === "number") return String(v.result);
    if (Array.isArray(v.richText)) {
      return v.richText.map((p) => (p as { text?: string }).text ?? "").join("");
    }
    if (typeof v.hyperlink === "string") return v.hyperlink;
    return "";
  }
  return String(value);
}

/**
 * Lê um .xlsx (Buffer) e devolve as contas mapeadas. Acha o cabeçalho pela 1ª linha
 * que contém 'username' ou 'remark', normaliza os nomes pra minúsculo, e ignora linhas vazias.
 */
export async function parseContasBuffer(buf: Buffer): Promise<ContaRow[]> {
  const wb = new ExcelJS.Workbook();
  // exceljs resolve `Buffer` contra outra versão de @types/node (via fast-csv),
  // então o genérico de Buffer diverge do nosso. Em runtime é um Buffer Node
  // válido; casamos pro tipo exato que `load` espera só pra atravessar o ruído.
  await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Coleta as linhas como matriz de texto (row.values é 1-based; dropamos o índice 0).
  const matrix: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values : [];
    matrix.push(values.slice(1).map(cellText));
  });

  // Acha a linha de cabeçalho.
  const headerIdx = matrix.findIndex((r) => {
    const lower = r.map((c) => c.trim().toLowerCase());
    return lower.includes("username") || lower.includes("remark");
  });
  if (headerIdx === -1) return [];
  const headers = matrix[headerIdx].map((c) => c.trim().toLowerCase());

  const records: Record<string, unknown>[] = [];
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const cells = matrix[i];
    if (cells.every((c) => c.trim() === "")) continue; // linha vazia
    const rec: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) rec[h] = cells[idx] ?? "";
    });
    records.push(rec);
  }
  return mapRows(records);
}
