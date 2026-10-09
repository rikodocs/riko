import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";
import { getIaConfig } from "@/lib/ia/config";
import { consultarCnpj, isCnpjValido } from "@/lib/cnpj/brasilapi";
import { gerarRespostasOpcLongo, type TipoLicencaOpc } from "@/lib/ia/gerar-index";

export const maxDuration = 60;

// OPC Antiga (formulário de 29 perguntas) — trazido da Mikey Ads.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, cnpj, dominio, seuNome, emailLogin, licencaTipo, licencaEspecifica, licencaDetentor } =
      body as {
        viewerId?: string;
        cnpj?: string;
        dominio?: string;
        seuNome?: string;
        emailLogin?: string;
        licencaTipo?: string;
        licencaEspecifica?: string;
        licencaDetentor?: string;
      };

    if (!(await getViewerRole(supabase, viewerId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    if (!isCnpjValido(cnpj ?? "")) {
      return NextResponse.json({ error: "CNPJ inválido — confira os 14 dígitos." }, { status: 400 });
    }
    const nome = (seuNome ?? "").trim();
    const email = (emailLogin ?? "").trim();
    if (!nome) return NextResponse.json({ error: "Preencha o nome de quem faz login na conta." }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Preencha o e-mail de login da conta do Google Ads." }, { status: 400 });

    const tipo: TipoLicencaOpc =
      licencaTipo === "governamental" ||
      licencaTipo === "profissional" ||
      licencaTipo === "fornecedor" ||
      licencaTipo === "outra_entidade"
        ? licencaTipo
        : "nenhuma";
    const especifica = (licencaEspecifica ?? "").trim();
    if (tipo !== "nenhuma" && !especifica) {
      return NextResponse.json({ error: "Preencha a licença/certificação específica (nº de registro etc.)." }, { status: 400 });
    }

    const cfg = await getIaConfig(supabase);
    if (!cfg) {
      return NextResponse.json({ error: "IA não configurada. Peça pro admin colar a chave da Anthropic em Configurações." }, { status: 400 });
    }

    const info = await consultarCnpj(cnpj ?? "");
    if (!info) {
      return NextResponse.json(
        { error: "Não consegui consultar esse CNPJ agora (nenhuma base de CNPJ respondeu)." },
        { status: 502 }
      );
    }

    const domLimpo = (dominio ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    const rr = await gerarRespostasOpcLongo(
      info,
      domLimpo || undefined,
      {
        seuNome: nome,
        emailLogin: email,
        licenca: { tipo, especifica, detentor: (licencaDetentor ?? "").trim() },
      },
      cfg
    );
    if ("error" in rr) return NextResponse.json({ error: rr.error }, { status: 400 });

    return NextResponse.json({ respostas: rr.respostas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
