import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getViewer, equipeDe } from "@/lib/equipe";
import { parseContasBuffer } from "@/lib/contas/xlsx";
import { cookieQuebrado } from "@/lib/contas/mapping";

export const maxDuration = 60;

type Resumo = { source_key: string; login: string | null; motivo?: string };

// Operador (ou moderador) sobe a planilha de contas — mesmo arquivo que subia
// na Mikey Ads. Dedupe por identificador (id/acc_id/username) dentro da equipe.
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const form = await request.formData();
    const viewerId = String(form.get("viewerId") ?? "");
    const produtoId = String(form.get("produtoId") ?? "");
    const file = form.get("arquivo");

    const viewer = await getViewer(supabase, viewerId);
    if (!viewer) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    const modId = equipeDe(viewer);
    if (!modId) {
      return NextResponse.json({ error: "Você ainda não está ligado a um moderador. Peça pro admin ajustar em Usuários." }, { status: 400 });
    }
    if (!produtoId) return NextResponse.json({ error: "Escolha um produto." }, { status: 400 });

    const { data: produto } = await supabase
      .from("produtos")
      .select("id, titulo, ativo")
      .eq("id", produtoId)
      .eq("moderador_id", modId)
      .single();
    if (!produto || !produto.ativo) {
      return NextResponse.json({ error: "Produto inválido ou desativado." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Anexe o arquivo .xlsx." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "O arquivo precisa ser .xlsx." }, { status: 400 });
    }

    let rows;
    try {
      rows = await parseContasBuffer(Buffer.from(await file.arrayBuffer()));
    } catch {
      return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 400 });
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma conta encontrada no arquivo (precisa ter a coluna username ou remark)." }, { status: 400 });
    }

    // Taxa atual do operador nesse produto — congela o valor na conta
    const { data: taxa } = await supabase
      .from("taxas_operador")
      .select("valor_centavos")
      .eq("operador_id", viewer.id)
      .eq("produto_id", produtoId)
      .maybeSingle();
    const valorCentavos = taxa?.valor_centavos ?? 0;

    // Já existentes na equipe (por identificador ou login)
    const quote = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
    const keys = rows.map((r) => r.source_key).filter(Boolean);
    const logins = rows.map((r) => r.login).filter(Boolean);
    const partes: string[] = [];
    if (keys.length) partes.push(`source_key.in.(${keys.map(quote).join(",")})`);
    if (logins.length) partes.push(`login.in.(${logins.map(quote).join(",")})`);
    const existentes = partes.length
      ? (await supabase.from("contas").select("source_key, login").eq("moderador_id", modId).or(partes.join(","))).data
      : [];
    const keySet = new Set((existentes || []).map((e) => e.source_key));
    const loginSet = new Set((existentes || []).map((e) => (e.login || "").toLowerCase()).filter(Boolean));

    const adicionadas: Resumo[] = [];
    const ignoradas: Resumo[] = [];
    const semCookie: Resumo[] = [];
    const vistos = new Set<string>();
    const inserts = [];

    for (const r of rows) {
      const resumo: Resumo = { source_key: r.source_key, login: r.login || null };
      if (!r.source_key) {
        ignoradas.push({ ...resumo, motivo: "sem identificador" });
        continue;
      }
      if (vistos.has(r.source_key)) {
        ignoradas.push({ ...resumo, motivo: "repetida no arquivo" });
        continue;
      }
      vistos.add(r.source_key);
      if (keySet.has(r.source_key)) {
        ignoradas.push({ ...resumo, motivo: "identificador já existe" });
        continue;
      }
      if (r.login && loginSet.has(r.login.toLowerCase())) {
        ignoradas.push({ ...resumo, motivo: "e-mail já existe" });
        continue;
      }
      // Cookie quebrado pelo Excel: entra sem cookie (a conta em si pode ser boa)
      let cookies = r.cookies;
      if (cookieQuebrado(cookies)) {
        cookies = "";
        semCookie.push(resumo);
      }
      inserts.push({
        moderador_id: modId,
        operador_id: viewer.id,
        produto_id: produtoId,
        source_key: r.source_key,
        cnpj: r.cnpj || null,
        login: r.login || null,
        senha: r.senha || null,
        dois_fatores: r.dois_fatores || null,
        cookies: cookies || null,
        proxy: r.proxy || null,
        ua: r.ua || null,
        import_extra: Object.keys(r.import_extra).length ? r.import_extra : null,
        valor_centavos: valorCentavos,
      });
      adicionadas.push(resumo);
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from("contas").insert(inserts);
      if (error) return NextResponse.json({ error: `Não foi possível salvar: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      produto: produto.titulo,
      total: rows.length,
      adicionadas,
      ignoradas,
      semCookie,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
