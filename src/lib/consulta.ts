import { SupabaseClient } from "@supabase/supabase-js";

export type ApiProvider = "owndata" | "supremo";

export interface ConsultaSettings {
  api_provider?: ApiProvider | null;
  // Usados só quando api_provider === "owndata" (conta/URL própria do cliente).
  api_url?: string | null;
  api_token?: string | null;
}

export interface ConsultaResult {
  ok: boolean;
  message: string;
  duplicate?: boolean;
}

interface PersonFields {
  name: string | null;
  birth_date: string | null;
  mother_name: string | null;
  profession: string | null;
  phones: string[];
  emails: string[];
  addresses: string[];
  city: string | null;
  state: string | null;
  score: string | null;
  income: string | null;
}

// URL fixa, sem token. Não é configurável em Configurações porque não
// depende de conta/assinatura — é um endpoint público único.
const SUPREMO_BASE_URL = "https://supremodoseteoriginal.com/?action=consultar_cpf_automatico&cpf=";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOwnData(apiData: any): PersonFields {
  const basicos = apiData.DadosBasicos || {};
  const economicos = apiData.DadosEconomicos || {};

  const phones: string[] = [];
  if (Array.isArray(apiData.telefones)) {
    for (const t of apiData.telefones) {
      const num = t?.telefone || t?.numero || t?.fone || t?.celular;
      if (num && String(num).trim()) phones.push(String(num).trim());
    }
  }

  const emails: string[] = [];
  if (Array.isArray(apiData.emails)) {
    for (const e of apiData.emails) {
      const val = typeof e === "string" ? e : e?.email || e?.valor;
      if (val && String(val).trim()) emails.push(String(val).trim());
    }
  }

  const addresses: string[] = [];
  if (Array.isArray(apiData.enderecos)) {
    for (const addr of apiData.enderecos) {
      if (typeof addr === "string") {
        if (addr.trim()) addresses.push(addr.trim());
      } else if (addr && typeof addr === "object") {
        const parts = [
          addr.tipoLogradouro
            ? `${addr.tipoLogradouro} ${addr.logradouro || ""}`.trim()
            : addr.logradouro || "",
          addr.logradouroNumero || addr.numero || "",
          addr.complemento || "",
          addr.bairro || "",
          addr.cidade || addr.municipio || "",
          addr.uf || addr.estado || "",
          addr.cep || "",
        ]
          .map((v: string) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean);
        if (parts.length > 0) addresses.push(parts.join(", "));
      }
    }
  }

  const profObj = apiData.profissao || {};
  const professionRaw = profObj.cboDescricao || profObj.descricao || profObj.cargo || "";
  const profession =
    typeof professionRaw === "string" && professionRaw.trim() && professionRaw !== "Sem descrição."
      ? professionRaw.trim()
      : null;

  const scoreObj = economicos.score || {};
  const scoreVal = scoreObj.scoreCSB || scoreObj.scoreCSBA || economicos.score_credito || "";

  const firstAddr = Array.isArray(apiData.enderecos) && apiData.enderecos[0] ? apiData.enderecos[0] : {};

  return {
    name: basicos.nome || apiData.nome || null,
    birth_date: basicos.dataNascimento || basicos.data_nascimento || apiData.dataNascimento || null,
    mother_name: basicos.nomeMae || basicos.nome_mae || apiData.nomeMae || null,
    profession,
    phones,
    emails,
    addresses,
    city: firstAddr.cidade || firstAddr.municipio || basicos.municipioNascimento || null,
    state: firstAddr.uf || firstAddr.estado || null,
    score: scoreVal ? String(scoreVal) : null,
    income: economicos.renda || economicos.renda_presumida || apiData.renda || null,
  };
}

// Essa API só retorna nome, nascimento, sexo, renda e telefones — sem
// e-mail, endereço, profissão ou score. Os campos que ela não tem ficam
// em branco (o cadastro continua funcionando normalmente).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSupremo(apiData: any): PersonFields | null {
  if (!apiData.success || !apiData.dados) return null;

  const dados = apiData.dados || {};

  const phones: string[] = Array.isArray(apiData.telefones)
    ? apiData.telefones.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const birthDateRaw = dados.NASC ? String(dados.NASC).trim() : "";
  const birthDate = birthDateRaw ? birthDateRaw.split(" ")[0] : null;

  return {
    name: dados.NOME || null,
    birth_date: birthDate,
    mother_name: null,
    profession: null,
    phones,
    emails: [],
    addresses: [],
    city: null,
    state: null,
    score: null,
    income: dados.RENDA || null,
  };
}

// Looks up a CPF against the configured provider (OwnData or Supremo dos 7),
// creates the `people` row, and updates every document in docIds accordingly.
// Used both by the admin batch review flow and the viewer accept flow.
export async function consultarPessoaPorCPF(
  supabase: SupabaseClient,
  cpf: string,
  docIds: string[],
  settings: ConsultaSettings
): Promise<ConsultaResult> {
  const { data: existingPerson } = await supabase
    .from("people")
    .select("id, name, used")
    .eq("cpf", cpf)
    .single();

  if (existingPerson) {
    for (const dId of docIds) {
      await supabase
        .from("documents")
        .update({ status: "duplicate", cpf_extracted: cpf })
        .eq("id", dId);
    }
    return {
      ok: false,
      duplicate: true,
      message: `CPF já cadastrado: ${existingPerson.name || "sem nome"}`,
    };
  }

  const provider: ApiProvider = settings.api_provider === "supremo" ? "supremo" : "owndata";

  const apiUrl =
    provider === "supremo"
      ? `${SUPREMO_BASE_URL}${cpf}`
      : `${settings.api_url}?token=${settings.api_token}&modulo=cpf&consulta=${cpf}`;

  const apiRes = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!apiRes.ok) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: `API retornou status ${apiRes.status}` };
  }

  const apiData = await apiRes.json();

  const fields = provider === "supremo" ? parseSupremo(apiData) : parseOwnData(apiData);

  if (!fields) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: "CPF não encontrado na API." };
  }

  const personData = {
    cpf,
    ...fields,
    raw_data: apiData,
    used: false,
  };

  const { data: newPerson, error: personError } = await supabase
    .from("people")
    .insert(personData)
    .select("id")
    .single();

  if (personError) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: `Falha ao salvar pessoa: ${personError.message}` };
  }

  for (const dId of docIds) {
    await supabase
      .from("documents")
      .update({ status: "consulted", cpf_extracted: cpf, person_id: newPerson.id })
      .eq("id", dId);
  }

  return { ok: true, message: `${personData.name || "Pessoa"} registrado com sucesso!` };
}
