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
        log.push(`[INFO] Campos da API: ${Object.keys(apiData).join(", ")}`);

        // Deep search helper: finds a value by trying multiple keys at any depth
        function findValue(obj: Record<string, unknown>, keys: string[]): string | null {
          // First try top-level
          for (const key of keys) {
            const val = obj[key];
            if (val && typeof val === "string" && val.trim()) return val.trim();
            if (val && typeof val === "number") return String(val);
          }
          // Then try nested objects (1 level deep)
          for (const k of Object.keys(obj)) {
            const nested = obj[k];
            if (nested && typeof nested === "object" && !Array.isArray(nested)) {
              for (const key of keys) {
                const val = (nested as Record<string, unknown>)[key];
                if (val && typeof val === "string" && val.trim()) return val.trim();
                if (val && typeof val === "number") return String(val);
              }
            }
          }
          // Try arrays of objects (e.g., telefones: [{numero: "..."}])
          for (const key of keys) {
            const arr = obj[key + "s"] || obj[key];
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object") {
              const first = arr[0] as Record<string, unknown>;
              const innerVal = first.numero || first.valor || first.email || first.telefone || Object.values(first).find(v => typeof v === "string" && v.trim());
              if (innerVal && typeof innerVal === "string") return innerVal.trim();
            }
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
              return arr[0];
            }
          }
          return null;
        }

        // Find first phone from telefones array if it exists
        let phoneValue = findValue(apiData, ["telefone", "TELEFONE", "celular", "phone", "fone"]);
        if (!phoneValue && Array.isArray(apiData.telefones) && apiData.telefones.length > 0) {
          const t = apiData.telefones[0];
          phoneValue = typeof t === "string" ? t : (t?.numero || t?.telefone || t?.fone || null);
        }

        // Find first email from emails array if it exists
        let emailValue = findValue(apiData, ["email", "EMAIL", "e_mail"]);
        if (!emailValue && Array.isArray(apiData.emails) && apiData.emails.length > 0) {
          const e = apiData.emails[0];
          emailValue = typeof e === "string" ? e : (e?.email || e?.valor || null);
        }

        // Build address from parts if needed
        let addressValue = findValue(apiData, ["endereco", "ENDERECO", "logradouro", "address"]);
        if (!addressValue) {
          const parts = [
            findValue(apiData, ["logradouro", "tipo_logradouro"]),
            findValue(apiData, ["numero", "num"]),
            findValue(apiData, ["complemento"]),
            findValue(apiData, ["bairro"]),
          ].filter(Boolean);
          if (parts.length > 0) addressValue = parts.join(", ");
        }

        const personData = {
          cpf,
          name: findValue(apiData, ["nome", "NOME", "name", "nomeCompleto", "nome_completo"]),
          birth_date: findValue(apiData, ["nascimento", "NASC", "data_nascimento", "dataNascimento", "birth_date", "dt_nascimento"]),
          mother_name: findValue(apiData, ["nome_mae", "NOME_MAE", "mae", "nomeMae", "mother", "mother_name"]),
          address: addressValue,
          city: findValue(apiData, ["cidade", "CIDADE", "municipio", "city", "localidade"]),
          state: findValue(apiData, ["uf", "UF", "estado", "state", "sigla_uf"]),
          phone: phoneValue,
          email: emailValue,
          score: findValue(apiData, ["score", "SCORE", "serasa_score", "scoreCredito"]),
          income: findValue(apiData, ["renda", "RENDA", "renda_presumida", "rendaPresumida", "income", "salario"]),
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
