import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewerRole } from "@/lib/viewer-role";
import { getIaConfig } from "@/lib/ia/config";
import { consultarCnpj } from "@/lib/cnpj/brasilapi";
import { gerarIndexHtml, gerarRespostasOpc, type RespostasOpc, type TamanhoRespostaOpc } from "@/lib/ia/gerar-index";

// Geração chama Receita + IA (2 chamadas): costuma levar 20-60s.
export const maxDuration = 60;

// "Testar gerador" (trazido da Mikey Ads): cola um CNPJ, escolhe o modelo e
// recebe o site + as respostas do formulário de verificação do Google Ads.
// Nos produtos OPC o caso é salvo automaticamente pra marcar aprovou/recusou.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, cnpj, escolha, dominio, emailModo, tamanho, permitirInativa } = body as {
      viewerId?: string;
      cnpj?: string;
      escolha?: string;
      dominio?: string;
      emailModo?: string;
      tamanho?: string;
      permitirInativa?: boolean;
    };

    if (!(await getViewerRole(supabase, viewerId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const dig = (cnpj ?? "").replace(/\D/g, "");
    if (dig.length !== 14) {
      return NextResponse.json({ error: "CNPJ inválido — confira os 14 dígitos." }, { status: 400 });
    }

    const cfg = await getIaConfig(supabase);
    if (!cfg) {
      return NextResponse.json({ error: "IA não configurada. Peça pro admin colar a chave da Anthropic em Configurações." }, { status: 400 });
    }

    const info = await consultarCnpj(dig);
    if (!info) {
      return NextResponse.json(
        { error: "Não consegui consultar esse CNPJ agora (nenhuma base de CNPJ respondeu). Tente de novo." },
        { status: 502 }
      );
    }

    // E-mail do site: "real" usa o e-mail do CNPJ; "dominio" (padrão) usa
    // contato@<dominio>. O do domínio tem que bater com onde o site é publicado.
    const domLimpo = (dominio ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    const dom = emailModo === "real" ? undefined : domLimpo || undefined;

    const produto = escolha === "cliente" ? "cliente" : "opc";
    const varianteOpc =
      escolha === "opc_suspensao" ? "suspensao" : escolha === "opc_aprovacao2" ? "aprovacao2" : "aprovacao";
    const r = await gerarIndexHtml(produto, { info, dominio: dom, varianteOpc, permitirInativa: !!permitirInativa }, cfg);
    if ("error" in r) {
      return NextResponse.json({ error: r.error }, { status: 400 });
    }

    const empresa = info.razao_social ?? dig;
    let respostas: RespostasOpc | undefined;
    let casoSalvo = false;
    if (produto === "opc") {
      const tam: TamanhoRespostaOpc = tamanho === "curta" ? "curta" : "completa";
      const rr = await gerarRespostasOpc(info, domLimpo || undefined, cfg, tam);
      if (!("error" in rr)) {
        respostas = rr.respostas;
        // Auto-salva como rascunho: é a base de aprendizado (o que aprovou/recusou).
        const { error } = await supabase.from("opc_casos").insert({
          empresa,
          cnpj: dig,
          dominio: domLimpo || null,
          site_html: r.html,
          respostas,
          status: "draft",
          created_by: viewerId,
        });
        casoSalvo = !error;
      }
    }

    return NextResponse.json({ html: r.html, empresa, respostas, casoSalvo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
