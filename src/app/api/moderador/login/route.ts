import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";

// Login do moderador por e-mail e senha (operadores continuam com código).
export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: user } = await supabase
      .from("viewer_users")
      .select("id, name, role, active, password_hash")
      .eq("email", email.trim().toLowerCase())
      .eq("role", "moderador")
      .single();

    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    return NextResponse.json({ id: user.id, name: user.name, role: "moderador" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
