import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";
import { gerarCodigo6Digitos } from "@/lib/codigo-acesso";

// Admin cria (ou redefine a senha de) um moderador com e-mail e senha.
export async function POST(request: Request) {
  try {
    const { name, email, password } = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const cleanEmail = email?.trim().toLowerCase();
    if (!name?.trim() || !cleanEmail || !password || password.length < 4) {
      return NextResponse.json({ error: "Nome, e-mail e senha (mín. 4 caracteres) são obrigatórios." }, { status: 400 });
    }

    const supabase = createServerClient();
    const password_hash = hashPassword(password);

    const { data: existing } = await supabase
      .from("viewer_users")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("viewer_users")
        .update({ name: name.trim(), password_hash, role: "moderador", active: true })
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, updated: true });
    }

    // code continua obrigatório/único na tabela, mesmo sem uso pro moderador
    let lastError = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase.from("viewer_users").insert({
        name: name.trim(),
        email: cleanEmail,
        password_hash,
        role: "moderador",
        code: gerarCodigo6Digitos(),
      });
      if (!error) return NextResponse.json({ ok: true, updated: false });
      lastError = error.message;
      if (!/code/i.test(error.message)) break;
    }
    return NextResponse.json({ error: lastError || "Não foi possível criar." }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
