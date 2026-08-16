import { SupabaseClient } from "@supabase/supabase-js";

export interface ConsultaSettings {
  api_url: string;
  api_token: string;
}

export interface ConsultaResult {
  ok: boolean;
  message: string;
  duplicate?: boolean;
}

// Looks up a CPF against the OwnData API, creates the `people` row, and
// updates every document in docIds accordingly. Used both by the admin
// batch review flow and the viewer accept flow.
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

  const apiUrl = `${settings.api_url}?token=${settings.api_token}&modulo=cpf&consulta=${cpf}`;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = apiData as any;

  const basicos = api.DadosBasicos || {};
  const economicos = api.DadosEconomicos || {};

  const phones: string[] = [];
  if (Array.isArray(api.telefones)) {
    for (const t of api.telefones) {
      const num = t?.telefone || t?.numero || t?.fone || t?.celular;
      if (num && String(num).trim()) phones.push(String(num).trim());
    }
  }

  const emails: string[] = [];
  if (Array.isArray(api.emails)) {
    for (const e of api.emails) {
      const val = typeof e === "string" ? e : e?.email || e?.valor;
      if (val && String(val).trim()) emails.push(String(val).trim());
    }
  }

  const addresses: string[] = [];
  if (Array.isArray(api.enderecos)) {
    for (const addr of api.enderecos) {
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

  const profObj = api.profissao || {};
  const professionRaw = profObj.cboDescricao || profObj.descricao || profObj.cargo || "";
  const profession =
    typeof professionRaw === "string" && professionRaw.trim() && professionRaw !== "Sem descrição."
      ? professionRaw.trim()
      : null;

  const scoreObj = economicos.score || {};
  const scoreVal = scoreObj.scoreCSB || scoreObj.scoreCSBA || economicos.score_credito || "";

  const firstAddr = Array.isArray(api.enderecos) && api.enderecos[0] ? api.enderecos[0] : {};

  const personData = {
    cpf,
    name: basicos.nome || api.nome || null,
    birth_date: basicos.dataNascimento || basicos.data_nascimento || api.dataNascimento || null,
    mother_name: basicos.nomeMae || basicos.nome_mae || api.nomeMae || null,
    profession,
    phones,
    emails,
    addresses,
    city: firstAddr.cidade || firstAddr.municipio || basicos.municipioNascimento || null,
    state: firstAddr.uf || firstAddr.estado || null,
    score: scoreVal ? String(scoreVal) : null,
    income: economicos.renda || economicos.renda_presumida || api.renda || null,
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
