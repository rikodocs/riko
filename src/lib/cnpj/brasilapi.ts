// Consulta de CNPJ na BrasilAPI (grátis) + helpers de formatação/validação.

export type CnpjInfo = {
  cnpj: string; // só dígitos
  razao_social: string | null;
  nicho: string | null; // cnae_fiscal_descricao
  cnae_codigo: string | null;
  municipio: string | null;
  uf: string | null;
  situacao: string | null;
  data_abertura: string | null; // data de início de atividade, DD/MM/AAAA
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
};

export function soDigitosCnpj(v: string): string {
  return v.replace(/\D/g, "");
}

/**
 * true se a empresa está ATIVA na Receita. Empresas INAPTA/BAIXADA/SUSPENSA/NULA
 * NÃO devem ser usadas na verificação (o G2/Meta recusa e pode suspender a conta).
 */
export function isEmpresaAtiva(situacao: string | null | undefined): boolean {
  return (situacao ?? "").trim().toUpperCase() === "ATIVA";
}

/**
 * Tempo de atuação DERIVADO da data de início de atividade (que vem da Receita).
 * É FATO, não invenção: a data é pública e vem do próprio CNPJ; a gente só
 * calcula os anos. Só devolve algo quando há data válida (DD/MM/AAAA) — sem
 * data, devolve null e o site NÃO deve afirmar tempo de mercado. Data no futuro
 * (registro recém-aberto / erro de cadastro) devolve anos = 0 (não afirma tempo).
 * `hoje` é injetável pra teste determinístico.
 */
export function tempoDeAtuacao(
  dataAberturaBr: string | null | undefined,
  hoje: Date = new Date(),
): { anoAbertura: string; anos: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dataAberturaBr ?? "").trim());
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  // Valida a data de verdade (rejeita 31/02, mês 13, etc.).
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  let anos = hoje.getFullYear() - ano;
  const aniversarioPassou =
    hoje.getMonth() > mes - 1 || (hoje.getMonth() === mes - 1 && hoje.getDate() >= dia);
  if (!aniversarioPassou) anos -= 1;
  if (anos < 0) anos = 0;
  return { anoAbertura: String(ano), anos };
}

/**
 * Telefone BR em dígitos nacionais (sem +55), recuperando o 9º dígito de celular
 * quando o registro (BrasilAPI/Receita) grava sem ele — caso comum que faz o
 * validador de telefone do G2RS recusar o número. Tira código do país (+55) e o
 * "0" de operadora. Devolve 10 ou 11 dígitos, ou "" se não reconhecer.
 */
export function normalizarTelefoneBr(v: string | null | undefined): string {
  let d = (v ?? "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2); // tira +55
  if (d.length >= 11 && d.startsWith("0")) d = d.slice(1); // tira 0 de operadora
  // celular antigo sem o 9º dígito: DD + 8 dígitos começando em 6-9 -> insere 9
  if (d.length === 10 && Number(d[2]) >= 6) d = `${d.slice(0, 2)}9${d.slice(2)}`;
  return d.length === 10 || d.length === 11 ? d : "";
}

export function formatCnpj(v: string): string {
  const d = soDigitosCnpj(v).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "/" + d.slice(8, 12);
  if (d.length > 12) out += "-" + d.slice(12, 14);
  return out;
}

/** Validação dos dígitos verificadores do CNPJ. */
export function isCnpjValido(v: string): boolean {
  const c = soDigitosCnpj(v);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string): number => {
    let soma = 0;
    let pos = base.length - 7;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c === c.slice(0, 12) + String(d1) + String(d2);
}

type BrasilApiCnpj = {
  razao_social?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
  descricao_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string | number;
  ddd_telefone_1?: string;
  email?: string;
};

type CnpjaOffice = {
  company?: { name?: string };
  founded?: string;
  mainActivity?: { id?: number; text?: string };
  address?: {
    city?: string;
    state?: string;
    street?: string;
    number?: string;
    details?: string;
    district?: string;
    zip?: string;
  };
  phones?: { area?: string; number?: string }[];
  emails?: { address?: string }[];
  status?: { text?: string };
};

/** Normaliza string vazia/whitespace para null. */
function nz(v: string | number | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

/** Data ISO (AAAA-MM-DD, com ou sem hora) -> DD/MM/AAAA; null se inválida. */
function formatDataBr(v: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((v ?? "").trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** fetch com timeout (aborta após `ms`); devolve null em erro/timeout. */
async function fetchJson(url: string, ms = 12000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { accept: "application/json" }, cache: "no-store", signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** `fetch` com timeout que já devolve o JSON (ou null em erro/status != 200). */
async function getJson<T>(url: string): Promise<T | null> {
  const r = await fetchJson(url);
  if (!r || !r.ok) return null;
  return (await r.json().catch(() => null)) as T | null;
}

/** Junta tipo + nome do logradouro ("AVENIDA" + "REPUBLICA DO CHILE"). */
function juntarLogradouro(tipo: string | null | undefined, nome: string | null | undefined): string | null {
  const n = nz(nome);
  if (!n) return null;
  const t = nz(tipo);
  return t && !n.toUpperCase().startsWith(t.toUpperCase()) ? `${t} ${n}` : n;
}

/** BrasilAPI e minhareceita.org devolvem o MESMO formato (a BrasilAPI usa os dados do minhareceita). */
function deFormatoBrasilApi(d: string, j: BrasilApiCnpj): CnpjInfo {
  return {
    cnpj: d,
    razao_social: j.razao_social ?? null,
    nicho: j.cnae_fiscal_descricao ?? null,
    cnae_codigo: j.cnae_fiscal != null ? String(j.cnae_fiscal) : null,
    municipio: j.municipio ?? null,
    uf: j.uf ?? null,
    situacao: j.descricao_situacao_cadastral ?? null,
    data_abertura: formatDataBr(j.data_inicio_atividade),
    logradouro: nz(j.logradouro),
    numero: nz(j.numero),
    complemento: nz(j.complemento),
    bairro: nz(j.bairro),
    cep: nz(String(j.cep ?? "").replace(/\D/g, "")),
    telefone: nz(j.ddd_telefone_1),
    email: nz(j.email),
  };
}

type CnpjWs = {
  razao_social?: string;
  estabelecimento?: {
    situacao_cadastral?: string;
    data_inicio_atividade?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string | null;
    bairro?: string;
    cep?: string;
    ddd1?: string | null;
    telefone1?: string | null;
    email?: string | null;
    atividade_principal?: { id?: string; descricao?: string };
    estado?: { sigla?: string };
    cidade?: { nome?: string };
  };
};

type ReceitaWs = {
  status?: string;
  nome?: string;
  situacao?: string;
  abertura?: string; // já vem DD/MM/AAAA
  atividade_principal?: { code?: string; text?: string }[];
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  email?: string;
  telefone?: string;
};

type OpenCnpj = {
  razao_social?: string;
  situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_principal?: string;
  tipo_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  uf?: string;
  municipio?: string;
  email?: string;
  telefones?: { ddd?: string; numero?: string }[];
};

type Fonte = { nome: string; buscar: (d: string) => Promise<CnpjInfo | null> };

/**
 * Bases de CNPJ (exportado só pra teste), na ordem de preferência. Todas grátis e sem chave; cada uma
 * tem seu PRÓPRIO limite de consultas por minuto. Na geração em massa a
 * BrasilAPI (e o único reserva que existia, o CNPJá) bloqueavam depois de
 * poucas consultas seguidas e o lote voltava "Não consegui consultar na
 * BrasilAPI" em quase todo CNPJ — com várias bases, quando uma limita a
 * próxima atende. A OpenCNPJ fica por último: não traz a DESCRIÇÃO da
 * atividade (só o código), e é a descrição que a IA usa pra escrever o site
 * do nicho certo.
 */
export const FONTES_CNPJ: Fonte[] = [
  {
    nome: "BrasilAPI",
    buscar: async (d) => {
      const j = await getJson<BrasilApiCnpj>(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
      return j?.razao_social ? deFormatoBrasilApi(d, j) : null;
    },
  },
  {
    nome: "minhareceita",
    buscar: async (d) => {
      const j = await getJson<BrasilApiCnpj>(`https://minhareceita.org/${d}`);
      return j?.razao_social ? deFormatoBrasilApi(d, j) : null;
    },
  },
  {
    nome: "CNPJ.ws",
    buscar: async (d) => {
      const j = await getJson<CnpjWs>(`https://publica.cnpj.ws/cnpj/${d}`);
      const e = j?.estabelecimento;
      if (!j?.razao_social || !e) return null;
      return {
        cnpj: d,
        razao_social: j.razao_social,
        nicho: nz(e.atividade_principal?.descricao),
        cnae_codigo: nz(e.atividade_principal?.id),
        municipio: nz(e.cidade?.nome)?.toUpperCase() ?? null,
        uf: nz(e.estado?.sigla),
        situacao: nz(e.situacao_cadastral)?.toUpperCase() ?? null,
        data_abertura: formatDataBr(e.data_inicio_atividade),
        logradouro: juntarLogradouro(e.tipo_logradouro, e.logradouro),
        numero: nz(e.numero),
        complemento: nz(e.complemento),
        bairro: nz(e.bairro),
        cep: nz(String(e.cep ?? "").replace(/\D/g, "")),
        telefone: nz(`${e.ddd1 ?? ""}${e.telefone1 ?? ""}`.replace(/\D/g, "")),
        email: nz(e.email),
      };
    },
  },
  {
    nome: "CNPJá",
    buscar: async (d) => {
      const j = await getJson<CnpjaOffice>(`https://open.cnpja.com/office/${d}`);
      if (!j?.company?.name) return null;
      const phone = j.phones?.[0];
      const telefone =
        phone && (phone.area || phone.number) ? `${phone.area ?? ""}${phone.number ?? ""}`.replace(/\D/g, "") : "";
      return {
        cnpj: d,
        razao_social: j.company.name,
        nicho: j.mainActivity?.text ?? null,
        cnae_codigo: j.mainActivity?.id != null ? String(j.mainActivity.id) : null,
        municipio: j.address?.city ?? null,
        uf: j.address?.state ?? null,
        situacao: j.status?.text ?? null,
        data_abertura: formatDataBr(j.founded),
        logradouro: nz(j.address?.street),
        numero: nz(j.address?.number),
        complemento: nz(j.address?.details),
        bairro: nz(j.address?.district),
        cep: nz(String(j.address?.zip ?? "").replace(/\D/g, "")),
        telefone: nz(telefone),
        email: nz(j.emails?.[0]?.address),
      };
    },
  },
  {
    nome: "ReceitaWS",
    buscar: async (d) => {
      const j = await getJson<ReceitaWs>(`https://receitaws.com.br/v1/cnpj/${d}`);
      if (!j || j.status === "ERROR" || !j.nome) return null;
      const abertura = /^\d{2}\/\d{2}\/\d{4}$/.test(j.abertura ?? "") ? (j.abertura as string) : null;
      return {
        cnpj: d,
        razao_social: j.nome,
        nicho: nz(j.atividade_principal?.[0]?.text),
        cnae_codigo: nz((j.atividade_principal?.[0]?.code ?? "").replace(/\D/g, "")),
        municipio: nz(j.municipio),
        uf: nz(j.uf),
        situacao: nz(j.situacao),
        data_abertura: abertura,
        logradouro: nz(j.logradouro),
        numero: nz(j.numero),
        complemento: nz(j.complemento),
        bairro: nz(j.bairro),
        cep: nz(String(j.cep ?? "").replace(/\D/g, "")),
        telefone: nz(String(j.telefone ?? "").split("/")[0].replace(/\D/g, "")),
        email: nz(j.email),
      };
    },
  },
  {
    nome: "OpenCNPJ",
    buscar: async (d) => {
      const j = await getJson<OpenCnpj>(`https://api.opencnpj.org/${d}`);
      if (!j?.razao_social) return null;
      const tel = j.telefones?.[0];
      return {
        cnpj: d,
        razao_social: j.razao_social,
        nicho: null, // essa base não traz a descrição da atividade
        cnae_codigo: nz(j.cnae_principal),
        municipio: nz(j.municipio),
        uf: nz(j.uf),
        situacao: nz(j.situacao_cadastral)?.toUpperCase() ?? null,
        data_abertura: formatDataBr(j.data_inicio_atividade),
        logradouro: juntarLogradouro(j.tipo_logradouro, j.logradouro),
        numero: nz(j.numero),
        complemento: nz(j.complemento),
        bairro: nz(j.bairro),
        cep: nz(String(j.cep ?? "").replace(/\D/g, "")),
        telefone: nz(`${tel?.ddd ?? ""}${tel?.numero ?? ""}`.replace(/\D/g, "")),
        email: nz(j.email),
      };
    },
  },
];

/**
 * Consulta o CNPJ tentando cada base de FONTES_CNPJ na ordem até uma responder.
 * Retorna null só se TODAS falharem (ou o CNPJ não existir).
 */
export async function consultarCnpj(cnpj: string): Promise<CnpjInfo | null> {
  const d = soDigitosCnpj(cnpj);
  if (d.length !== 14) return null;

  for (const fonte of FONTES_CNPJ) {
    try {
      const info = await fonte.buscar(d);
      if (info) return info;
    } catch (e) {
      console.error(`[consultarCnpj] ${fonte.nome} falhou:`, e);
    }
  }
  return null;
}
