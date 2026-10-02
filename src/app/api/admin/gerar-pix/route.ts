import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createServerClient } from "@/lib/supabase";

const ATIVOPAY_URL = "https://api-gateway.ativopay.com/api/user/transactions";

function findPixCode(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;
  if (typeof value === "string") {
    const s = value.trim();
    return s.startsWith("000201") ? s : null;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const found = findPixCode(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

// Gera um PIX copia e cola via Ativopay usando o token/CPF/telefone fixos
// salvos em settings. So o valor e a descricao mudam a cada chamada.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { valor, descricao } = body as { valor?: number; descricao?: string };

    if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0.01) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("pix_api_token, pix_cpf, pix_telefone")
      .eq("id", 1)
      .single();

    const token = settings?.pix_api_token?.trim();
    const cpf = (settings?.pix_cpf || "").replace(/\D/g, "");
    const telefone = (settings?.pix_telefone || "").replace(/\D/g, "");

    if (!token || cpf.length !== 11 || telefone.length < 10) {
      return NextResponse.json(
        { error: "Configure token, CPF e telefone do PIX antes de gerar." },
        { status: 400 }
      );
    }

    // API trabalha em centavos
    const valorCentavos = Math.round(valor * 100);
    const titulo = descricao?.trim() || "Pagamento";

    const payload = {
      pix: { expiresInDays: 1 },
      items: [
        {
          title: titulo,
          quantity: 1,
          tangible: false,
          unitPrice: valorCentavos,
          externalRef: `pix_${Date.now()}`,
        },
      ],
      amount: valorCentavos,
      currency: "BRL",
      customer: {
        name: "Cliente",
        email: "cliente@email.com",
        phone: telefone,
        document: { type: "CPF", number: cpf },
      },
      metadata: "",
      traceable: false,
      paymentMethod: "PIX",
    };

    const res = await fetch(ATIVOPAY_URL, {
      method: "POST",
      headers: {
        "x-api-key": token,
        "User-Agent": "AtivoB2B/1.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro da API: ${res.status} - ${text}` },
        { status: 400 }
      );
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Resposta inválida da API" }, { status: 400 });
    }

    if (result.status !== undefined && result.status !== 200) {
      return NextResponse.json(
        { error: result.message || "Erro desconhecido" },
        { status: 400 }
      );
    }

    // O nome do campo varia (qrcode, qrCode, brCode, payload, emv...), então
    // procura na resposta inteira a string do PIX copia e cola (EMV começa
    // com "000201") e gera o QR Code a partir dela.
    const copyPaste = findPixCode(result.data ?? result);
    if (!copyPaste) {
      const pixKeys = result.data?.pix ? Object.keys(result.data.pix).join(", ") : "nenhum";
      return NextResponse.json(
        {
          error: `Copia e cola não encontrado na resposta da API (campos do pix: ${pixKeys}). Resposta: ${text.slice(0, 500)}`,
        },
        { status: 400 }
      );
    }

    const qrcode = await QRCode.toDataURL(copyPaste, { width: 512, margin: 1 });

    return NextResponse.json({
      qrcode,
      copyPaste,
      id: result.data?.id ?? null,
      valor: valorCentavos / 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: `Erro: ${message}` }, { status: 500 });
  }
}
