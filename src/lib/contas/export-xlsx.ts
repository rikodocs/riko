import ExcelJS from "exceljs";

export type ContaExport = {
  source_key?: string | null;
  login: string | null;
  senha: string | null;
  dois_fatores: string | null;
  cookies: string | null;
  proxy: string | null;
  cnpj: string | null;
  /** User-Agent do AdsPower — reemitido na coluna `ua` do import (mesmo dispositivo). */
  ua?: string | null;
  /** platform, proxytype, ipchecker, proxyurl, proxyid, ip, countrycode (fiel ao export). */
  import_extra?: Record<string, string> | null;
};

/**
 * Colunas do TEMPLATE DE IMPORT do AdsPower (Account-import-template.xlsx) — na
 * ordem exata. É diferente do arquivo que o AdsPower exporta; é este que o import
 * dele aceita. Todos os campos presentes (mesmo em branco).
 */
const COLUNAS = [
  "name", "remark", "tab", "platform", "username", "password", "fakey", "cookie",
  "proxytype", "ipchecker", "proxy", "proxyurl", "proxyid", "ip", "countrycode",
  "regioncode", "citycode", "ua", "resolution",
] as const;

const PLATFORM = "accounts.google.com";

/** Monta o .xlsx no formato de IMPORT do AdsPower e devolve em base64. */
export async function contasParaXlsxBase64(contas: ContaExport[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Contas");
  ws.addRow([...COLUNAS]);
  for (const c of contas) {
    const login = c.login ?? "";
    const senha = c.senha ?? "";
    const cnpjDigitos = (c.cnpj ?? "").replace(/\D/g, "");
    const proxy = (c.proxy ?? "").trim();
    const ex = c.import_extra ?? {}; // valores fiéis do export (geo/proxy)
    ws.addRow([
      `${login}:${senha}`,                        // name = user:pass
      cnpjDigitos ? `CNPJ:\n${cnpjDigitos}` : "", // remark = CNPJ
      "",                                         // tab (não vem no export)
      ex.platform || PLATFORM,                    // platform
      login,                                      // username
      senha,                                      // password
      c.dois_fatores ?? "",                       // fakey (2FA)
      c.cookies ?? "",                            // cookie
      ex.proxytype || (proxy ? "socks5" : "noproxy"), // proxytype
      ex.ipchecker || "IP2Location",              // ipchecker
      proxy,                                      // proxy (host:port:user:pass)
      ex.proxyurl || "",                          // proxyurl
      ex.proxyid || "",                           // proxyid
      ex.ip || "",                                // ip (IP de saída do proxy)
      ex.countrycode || "",                       // countrycode
      "", "",                                     // regioncode, citycode (não vêm no export)
      c.ua ?? "",                                 // ua = User-Agent original do AdsPower
      "",                                         // resolution (não vem no export)
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf).toString("base64");
}
