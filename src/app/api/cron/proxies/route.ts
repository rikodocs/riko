import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { expirarVencidos } from "@/lib/proxy-mikey";

// Tarefa diária da Vercel: desativa os proxies que já venceram.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const supabase = createServerClient();
  let total = 0;
  for (let i = 0; i < 20; i++) {
    const n = await expirarVencidos(supabase, 50);
    total += n;
    if (n < 50) break;
  }
  return NextResponse.json({ ok: true, expirados: total });
}
