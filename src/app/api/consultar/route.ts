import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Tesseract from "tesseract.js";

// Extract CPF from text using regex
function extractCPF(text: string): string | null {
  // Match CPF patterns: 000.000.000-00 or 00000000000
  const patterns = [
    /\d{3}\.\d{3}\.\d{3}-\d{2}/,
    /\d{11}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean to only digits
      const cpf = match[0].replace(/\D/g, "");
      // Basic CPF validation (11 digits, not all same)
      if (cpf.length === 11 && !/^(\d)\1{10}$/.test(cpf)) {
        return cpf;
      }
    }
  }
  return null;
}

// Format CPF for display
function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export async function POST() {
  const supabase = createServerClient();
  const log: string[] = [];
  const notifications: string[] = [];

  try {
    // Get API settings
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings?.api_url || !settings?.api_token) {
      return NextResponse.json(
        { error: "Configure a URL e o Token da API em Configurações." },
        { status: 400 }
      );
    }

    // Get pending documents
    const { data: pendingDocs } = await supabase
      .from("documents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!pendingDocs || pendingDocs.length === 0) {
      return NextResponse.json(
        { error: "Nenhum documento pendente encontrado." },
        { status: 400 }
      );
    }

    log.push(`[INFO] Processando ${pendingDocs.length} documento(s) pendente(s)...`);

    for (const doc of pendingDocs) {
      log.push(`\n[INFO] Processando: ${doc.file_name}`);

      try {
        let extractedText = "";

        // Download the file from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("documents")
          .download(doc.file_path);

        if (downloadError || !fileData) {
          log.push(`[ERRO] Falha ao baixar arquivo: ${doc.file_name}`);
          continue;
        }

        // For images, use Tesseract OCR
        if (doc.file_type?.startsWith("image/")) {
          const buffer = Buffer.from(await fileData.arrayBuffer());
          const { data: ocrData } = await Tesseract.recognize(buffer, "por", {
            logger: () => {},
          });
          extractedText = ocrData.text;
          log.push(`[INFO] OCR concluído para imagem: ${doc.file_name}`);
        }
        // For PDFs, try to extract text
        else if (doc.file_type === "application/pdf") {
          // Convert PDF to image using canvas approach or extract text
          // For now we use Tesseract on the PDF buffer directly
          const buffer = Buffer.from(await fileData.arrayBuffer());
          try {
            const { data: ocrData } = await Tesseract.recognize(buffer, "por", {
              logger: () => {},
            });
            extractedText = ocrData.text;
            log.push(`[INFO] OCR concluído para PDF: ${doc.file_name}`);
          } catch {
            log.push(`[ERRO] Falha no OCR do PDF: ${doc.file_name}`);
            continue;
          }
        }

        // Extract CPF
        const cpf = extractCPF(extractedText);

        if (!cpf) {
          log.push(`[ERRO] CPF não encontrado em: ${doc.file_name}`);
          // Mark as error so we don't retry indefinitely
          await supabase
            .from("documents")
            .update({ status: "error", extracted_text: extractedText.substring(0, 500) })
            .eq("id", doc.id);
          continue;
        }

        log.push(`[INFO] CPF encontrado: ${formatCPF(cpf)}`);

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
            `Documento duplicado detectado! CPF ${formatCPF(cpf)} (${existingPerson.name || "sem nome"}) já existe no sistema. Arquivo: ${doc.file_name}`
          );

          // Link document to existing person, mark as duplicate
          await supabase
            .from("documents")
            .update({
              status: "duplicate",
              cpf_extracted: cpf,
              person_id: existingPerson.id,
            })
            .eq("id", doc.id);
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
        // The API structure may vary, so we store raw_data and try to extract common fields
        const personData = {
          cpf,
          name: apiData.NOME || apiData.nome || apiData.name || null,
          birth_date:
            apiData.NASC || apiData.nascimento || apiData.data_nascimento || null,
          mother_name:
            apiData.NOME_MAE || apiData.mae || apiData.nome_mae || null,
          address:
            apiData.ENDERECO ||
            apiData.endereco ||
            apiData.logradouro ||
            null,
          city: apiData.CIDADE || apiData.cidade || apiData.municipio || null,
          state: apiData.UF || apiData.uf || apiData.estado || null,
          phone:
            apiData.TELEFONE || apiData.telefone || apiData.celular || null,
          email: apiData.EMAIL || apiData.email || null,
          score:
            apiData.SCORE?.toString() || apiData.score?.toString() || null,
          income:
            apiData.RENDA?.toString() ||
            apiData.renda?.toString() ||
            apiData.renda_presumida?.toString() ||
            null,
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
          .eq("id", doc.id);

        log.push(
          `[OK] ${personData.name || "Pessoa"} (CPF: ${formatCPF(cpf)}) registrado com sucesso!`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        log.push(`[ERRO] Falha ao processar ${doc.file_name}: ${message}`);
      }
    }

    log.push(`\n[INFO] Processamento concluído.`);

    return NextResponse.json({ log, notifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
