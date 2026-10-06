export interface ParsedSite {
  cnpj: string; // só dígitos (14)
  url: string;
}

export interface ParsedSites {
  sites: ParsedSite[];
  invalid: string[]; // linhas que não deu pra entender
}

export function formatCnpj(cnpj: string): string {
  const d = (cnpj || "").replace(/\D/g, "");
  return d.length === 14
    ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
    : cnpj;
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!/^https?:\/\//i.test(t)) return null;
  try {
    const u = new URL(t);
    return u.toString();
  } catch {
    return null;
  }
}

// Aceita o texto colado: um CNPJ numa linha e a URL na linha seguinte
// (linhas em branco entre os pares são ignoradas). Também aceita CNPJ e URL
// na mesma linha, e URL sozinha cujo subdomínio é o CNPJ (14 dígitos).
export function parseSites(text: string): ParsedSites {
  const sites: ParsedSite[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let pendingCnpj: string | null = null;

  function push(cnpj: string, url: string) {
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sites.push({ cnpj, url });
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const urlMatch = line.match(/https?:\/\/\S+/i);
    const urlPart = urlMatch ? normalizeUrl(urlMatch[0]) : null;
    const cnpjCandidate = (urlMatch ? line.replace(urlMatch[0], "") : line).replace(/\D/g, "");

    if (urlMatch && !urlPart) {
      invalid.push(line);
      continue;
    }

    if (urlPart) {
      let cnpj: string | null = null;
      if (cnpjCandidate.length === 14) {
        cnpj = cnpjCandidate;
      } else if (pendingCnpj) {
        cnpj = pendingCnpj;
      } else {
        const host = new URL(urlPart).hostname.split(".")[0].replace(/\D/g, "");
        if (host.length === 14) cnpj = host;
      }
      if (cnpj) {
        push(cnpj, urlPart);
        pendingCnpj = null;
      } else {
        invalid.push(line);
      }
      continue;
    }

    if (cnpjCandidate.length === 14) {
      if (pendingCnpj) invalid.push(pendingCnpj); // CNPJ anterior ficou sem URL
      pendingCnpj = cnpjCandidate;
    } else {
      invalid.push(line);
    }
  }

  if (pendingCnpj) invalid.push(pendingCnpj);
  return { sites, invalid };
}
