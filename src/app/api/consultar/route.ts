import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Format CPF for display
function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Receives a list of {docId, cpf} pairs from the client (OCR done client-side)
export async function POST(request: Request) {
  const log: string[] = [];
  const notifications: string[] = [];
  const duplicates: string[] = [];

  try {
    const supabase = createServerClient();

    // Get API settings
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (settingsError) {
      return NextResponse.json(
        { error: `Erro ao ler configurações: ${settingsError.message}` },
        { status: 400 }
      );
    }

    if (!settings?.api_url || !settings?.api_token) {
      return NextResponse.json(
        { error: "Configure a URL e o Token da API em Configurações." },
        { status: 400 }
      );
    }

    // Get the documents with extracted CPFs from client
    const body = await request.json();
    const documents: { docId: string; cpf: string }[] = body.documents || [];

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "Nenhum documento com CPF extraído para consultar." },
        { status: 400 }
      );
    }

    // Group documents by CPF so multiple docs with same CPF are handled together
    const cpfGroups = new Map<string, string[]>();
    for (const { docId, cpf } of documents) {
      if (!cpfGroups.has(cpf)) cpfGroups.set(cpf, []);
      cpfGroups.get(cpf)!.push(docId);
    }

    log.push(`[INFO] Consultando ${cpfGroups.size} CPF(s) com ${documents.length} documento(s)...`);

    for (const [cpf, docIds] of cpfGroups) {
      try {
        log.push(`[INFO] Processando CPF: ${formatCPF(cpf)} (${docIds.length} doc(s))`);

        // Check if this person already exists (duplicate detection)
        const { data: existingPerson } = await supabase
          .from("people")
          .select("id, name, used")
          .eq("cpf", cpf)
          .single();

        if (existingPerson) {
          const isUsed = existingPerson.used === true;
          log.push(
            `[DUPLICADO] CPF ${formatCPF(cpf)} já cadastrado: ${existingPerson.name || "sem nome"}${isUsed ? " (já utilizado)" : ""}`
          );
          notifications.push(
            `CPF ${formatCPF(cpf)} (${existingPerson.name || "sem nome"}) já existe no sistema${isUsed ? " e já foi utilizado" : ""}. Documento descartado.`
          );
          duplicates.push(cpf);

          // Mark all docs for this CPF as duplicate
          for (const dId of docIds) {
            await supabase
              .from("documents")
              .update({
                status: "duplicate",
                cpf_extracted: cpf,
              })
              .eq("id", dId);
          }
          continue;
        }

        // Query the OwnData API
        log.push(`[INFO] Consultando API para CPF: ${formatCPF(cpf)}...`);
        const apiUrl = `${settings.api_url}?token=${settings.api_token}&modulo=cpf&consulta=${cpf}`;

        const apiRes = await fetch(apiUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!apiRes.ok) {
          log.push(`[ERRO] API retornou status ${apiRes.status} para CPF ${formatCPF(cpf)}`);
          continue;
        }

        const apiData = await apiRes.json();
        log.push(`[OK] Dados recebidos da API para CPF ${formatCPF(cpf)}`);
        log.push(`[INFO] Campos da API: ${Object.keys(apiData).join(", ")}`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api = apiData as any;

        // Extract from known API structure: DadosBasicos, DadosEconomicos, profissao, etc.
        const basicos = api.DadosBasicos || {};
        const economicos = api.DadosEconomicos || {};

        // Extract phones (ALL from telefones array)
        const phones: string[] = [];
        if (Array.isArray(api.telefones)) {
          for (const t of api.telefones) {
            const num = t?.telefone || t?.numero || t?.fone || t?.celular;
            if (num && String(num).trim()) phones.push(String(num).trim());
          }
        }

        // Extract emails (ALL from emails array)
        const emails: string[] = [];
        if (Array.isArray(api.emails)) {
          for (const e of api.emails) {
            const val = typeof e === "string" ? e : (e?.email || e?.valor);
            if (val && String(val).trim()) emails.push(String(val).trim());
          }
        }

        // Extract addresses (ALL from enderecos array)
        const addresses: string[] = [];
        if (Array.isArray(api.enderecos)) {
          for (const addr of api.enderecos) {
            if (typeof addr === "string") {
              if (addr.trim()) addresses.push(addr.trim());
            } else if (addr && typeof addr === "object") {
              const parts = [
                addr.tipoLogradouro ? `${addr.tipoLogradouro} ${addr.logradouro || ""}`.trim() : (addr.logradouro || ""),
                addr.logradouroNumero || addr.numero || "",
                addr.complemento || "",
                addr.bairro || "",
                addr.cidade || addr.municipio || "",
                addr.uf || addr.estado || "",
                addr.cep || "",
              ].map((v: string) => typeof v === "string" ? v.trim() : "").filter(Boolean);
              if (parts.length > 0) addresses.push(parts.join(", "));
            }
          }
        }

        // Extract profession from profissao object
        const profObj = api.profissao || {};
        const professionRaw = profObj.cboDescricao || profObj.descricao || profObj.cargo || "";
        const profession = (typeof professionRaw === "string" && professionRaw.trim() && professionRaw !== "Sem descrição.") ? professionRaw.trim() : null;

        // Extract score from DadosEconomicos.score object
        const scoreObj = economicos.score || {};
        const scoreVal = scoreObj.scoreCSB || scoreObj.scoreCSBA || economicos.score_credito || "";

        // Extract city/state from first address if not at root
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

        log.push(`[INFO] Nome: ${personData.name || "N/A"} | Nasc: ${personData.birth_date || "N/A"} | Cidade: ${personData.city || "N/A"}`);

        // Insert person
        const { data: newPerson, error: personError } = await supabase
          .from("people")
          .insert(personData)
          .select("id")
          .single();

        if (personError) {
          log.push(`[ERRO] Falha ao salvar pessoa: ${personError.message}`);
          continue;
        }

        // Update ALL documents for this CPF
        for (const dId of docIds) {
          await supabase
            .from("documents")
            .update({
              status: "consulted",
              cpf_extracted: cpf,
              person_id: newPerson.id,
            })
            .eq("id", dId);
        }

        log.push(
          `[OK] ${personData.name || "Pessoa"} (CPF: ${formatCPF(cpf)}) registrado com sucesso!`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        log.push(`[ERRO] Falha ao processar CPF ${formatCPF(cpf)}: ${message}`);
        // Mark all docs for this CPF as error
        for (const dId of docIds) {
          await supabase
            .from("documents")
            .update({ status: "error" })
            .eq("id", dId);
        }
      }
    }

    // Count how many CPFs were actually successful (person created + docs linked)
    const successCount = cpfGroups.size - duplicates.length;

    log.push(`\n[INFO] Processamento concluído.`);
    return NextResponse.json({ log, notifications, duplicates, successCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
