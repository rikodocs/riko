import { SupabaseClient } from "@supabase/supabase-js";

export interface ConsultaSettings {
  api_url: string;
  api_token?: string;
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

  // API atual: URL fixa (configurada em Configurações como settings.api_url,
  // já terminando em "...&cpf="), sem token — só concatena o CPF no final.
  // Ex: https://supremodoseteoriginal.com/?action=consultar_cpf_automatico&cpf=
  const apiUrl = `${settings.api_url}${cpf}`;
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

  if (!api.success || !api.dados) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: "CPF não encontrado na API." };
  }

  const dados = api.dados || {};

  // Essa API só retorna nome, nascimento, sexo, renda e telefones — sem
  // e-mail, endereço, profissão ou score. Preenche só o que vem, o resto
  // fica em branco (o cadastro continua funcionando normalmente).
  const phones: string[] = Array.isArray(api.telefones)
    ? api.telefones.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const birthDateRaw = dados.NASC ? String(dados.NASC).trim() : "";
  const birthDate = birthDateRaw ? birthDateRaw.split(" ")[0] : null;

  const personData = {
    cpf,
    name: dados.NOME || null,
    birth_date: birthDate,
    mother_name: null,
    profession: null,
    phones,
    emails: [] as string[],
    addresses: [] as string[],
    city: null,
    state: null,
    score: null,
    income: dados.RENDA || null,
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
