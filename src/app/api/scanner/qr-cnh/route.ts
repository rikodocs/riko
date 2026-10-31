import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { classifyDoc } from "@/lib/doc-classify";

// A leitura do PDF (texto + QR) roda no navegador; esta rota só lista a fila e grava o resultado.
//   stats   — contagens por categoria
//   pending — fila de docs ainda não escaneados
//   list    — docs de uma categoria (para o modal)
//   reset   — devolve os "outro" para a fila
//   save    — grava categoria; CNH/RG digital já vão aprovados pro estoque

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { action, docId } = body as { action?: string; docId?: string };

    if (action === "stats") {
      // CNH/RG digital são sempre aprovados: garante que nenhum fique parado na moderação.
      await supabase
        .from("documents")
        .update({ status: "available" })
        .eq("status", "pending_review")
        .in("doc_category", ["cnh_digital", "rg_digital"]);

      const [{ count: cnh }, { count: rg }, { count: outro }, { count: pending }] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "available").is("assigned_to", null).eq("doc_category", "cnh_digital"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "available").is("assigned_to", null).eq("doc_category", "rg_digital"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").eq("doc_category", "outro"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").is("doc_category", null),
      ]);
      return NextResponse.json({
        cnh_digital: cnh || 0,
        rg_digital: rg || 0,
        outro: outro || 0,
        pending_scan: pending || 0,
      });
    }

    if (action === "pending") {
      const { data } = await supabase
        .from("documents")
        .select("id, file_name, file_type")
        .eq("status", "pending_review")
        .is("doc_category", null)
        .order("created_at", { ascending: true })
        .limit(1000);
      return NextResponse.json({ docs: data || [] });
    }

    if (action === "list") {
      const category = body.category as string;
      let q = supabase
        .from("documents")
        .select("id, file_name, file_type, qr_data, created_at")
        .order("created_at", { ascending: true })
        .limit(500);
      if (category === "pending_scan") q = q.eq("status", "pending_review").is("doc_category", null);
      else if (category === "outro") q = q.eq("status", "pending_review").eq("doc_category", "outro");
      else q = q.eq("status", "available").is("assigned_to", null).eq("doc_category", category);
      const { data } = await q;
      return NextResponse.json({ docs: data || [] });
    }

    if (action === "reset") {
      const { error } = await supabase
        .from("documents")
        .update({ doc_category: null, qr_data: null })
        .eq("status", "pending_review")
        .eq("doc_category", "outro");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "save" && docId) {
      const qr = (body.qr as string | null) || null;
      const text = (body.text as string | undefined) || "";
      const category = classifyDoc(qr, text);
      const digital = category !== "outro";
      const { error } = await supabase
        .from("documents")
        .update({ doc_category: category, qr_data: qr, ...(digital ? { status: "available" } : {}) })
        .eq("id", docId)
        .eq("status", "pending_review");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ id: docId, category });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
