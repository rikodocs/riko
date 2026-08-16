import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { consultarPessoaPorCPF } from "@/lib/consulta";

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

        const result = await consultarPessoaPorCPF(supabase, cpf, docIds, settings);

        if (result.duplicate) {
          log.push(`[DUPLICADO] CPF ${formatCPF(cpf)}: ${result.message}`);
          notifications.push(`CPF ${formatCPF(cpf)}: ${result.message}. Documento descartado.`);
          duplicates.push(cpf);
          continue;
        }

        if (!result.ok) {
          log.push(`[ERRO] CPF ${formatCPF(cpf)}: ${result.message}`);
          continue;
        }

        log.push(`[OK] ${result.message} (CPF: ${formatCPF(cpf)})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        log.push(`[ERRO] Falha ao processar CPF ${formatCPF(cpf)}: ${message}`);
        for (const dId of docIds) {
          await supabase.from("documents").update({ status: "error" }).eq("id", dId);
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
