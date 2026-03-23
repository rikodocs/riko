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

    log.push(`[INFO] Consultando ${documents.length} documento(s)...`);

    for (const { docId, cpf } of documents) {
      try {
        log.push(`[INFO] Processando CPF: ${formatCPF(cpf)}`);

        // Check if this person already exists (duplicate detection)
        const { data: existingPerson } = await supabase
          .from("people")
          .select("id, name")
          .eq("cpf", cpf)
          .single();

        if (existingPerson) {
          log.push(
            `[DUPLICADO] CPF ${formatCPF(cpf)} já cadastrado: ${existingPerson.name || "sem nome"}`
          );
          notifications.push(
            `Documento duplicado! CPF ${formatCPF(cpf)} (${existingPerson.name || "sem nome"}) já existe no sistema.`
          );

          await supabase
            .from("documents")
            .update({
              status: "duplicate",
              cpf_extracted: cpf,
              person_id: existingPerson.id,
            })
            .eq("id", docId);
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

        // Extract relevant fields from the API response
        const personData = {
          cpf,
          name: apiData.NOME || apiData.nome || apiData.name || null,
          birth_date: apiData.NASC || apiData.nascimento || apiData.data_nascimento || null,
          mother_name: apiData.NOME_MAE || apiData.mae || apiData.nome_mae || null,
          address: apiData.ENDERECO || apiData.endereco || apiData.logradouro || null,
          city: apiData.CIDADE || apiData.cidade || apiData.municipio || null,
          state: apiData.UF || apiData.uf || apiData.estado || null,
          phone: apiData.TELEFONE || apiData.telefone || apiData.celular || null,
          email: apiData.EMAIL || apiData.email || null,
          score: apiData.SCORE?.toString() || apiData.score?.toString() || null,
          income: apiData.RENDA?.toString() || apiData.renda?.toString() || apiData.renda_presumida?.toString() || null,
          raw_data: apiData,
          used: false,
        };

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

        // Update document
        await supabase
          .from("documents")
          .update({
            status: "consulted",
            cpf_extracted: cpf,
            person_id: newPerson.id,
          })
          .eq("id", docId);

        log.push(
          `[OK] ${personData.name || "Pessoa"} (CPF: ${formatCPF(cpf)}) registrado com sucesso!`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        log.push(`[ERRO] Falha ao processar CPF ${formatCPF(cpf)}: ${message}`);
      }
    }

    log.push(`\n[INFO] Processamento concluído.`);
    return NextResponse.json({ log, notifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
