import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import jsQR from "jsqr";

// Scans a document's PDF for QR codes to classify:
//   cnh_digital — QR com URL do SENATRAN/SERPRO/DENATRAN
//   rg_digital  — QR com URL do gov.br/cin, identidade digital, ICN
//   outro       — sem QR ou QR não reconhecido
//
// Actions:
//   scan-one  — scan a single document by id
//   scan-all  — scan all pending_review docs that haven't been classified yet
//   stats     — return counts by category

const CNH_PATTERNS = [
  "senatran", "serpro", "denatran", "dnit.gov",
  "portalservicos", "servicos.dnit",
  "gov.br/cnh", "validacnh",
];

const RG_PATTERNS = [
  "gov.br/cin", "gov.br/rg", "identidade", "icn.gov",
  "iin.gov", "cin.gov", "pfrg", "biometria",
  "carteira de identidade", "registro geral",
];

type DocCategory = "cnh_digital" | "rg_digital" | "outro";

function classifyQr(text: string): DocCategory {
  const lower = text.toLowerCase();
  if (CNH_PATTERNS.some((p) => lower.includes(p))) return "cnh_digital";
  if (RG_PATTERNS.some((p) => lower.includes(p))) return "rg_digital";
  return "outro";
}

async function extractQrFromPdf(pdfBytes: ArrayBuffer): Promise<string | null> {
  // Use sharp to convert PDF page to raw pixel data, then scan with jsQR
  const sharp = (await import("sharp")).default;

  try {
    // Sharp reads the first page of a PDF by default
    const img = sharp(Buffer.from(pdfBytes), { density: 150 });
    const { width, height } = await img.metadata();
    if (!width || !height) return null;

    const raw = await img
      .ensureAlpha()
      .raw()
      .toBuffer();

    const result = jsQR(new Uint8ClampedArray(raw.buffer), width, height);
    if (result?.data) return result.data;

    // Try with higher DPI for small QR codes
    const img2 = sharp(Buffer.from(pdfBytes), { density: 300 });
    const meta2 = await img2.metadata();
    if (!meta2.width || !meta2.height) return null;

    const raw2 = await img2.ensureAlpha().raw().toBuffer();
    const result2 = jsQR(new Uint8ClampedArray(raw2.buffer), meta2.width, meta2.height);
    return result2?.data || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { action, docId } = body as { action?: string; docId?: string; skip?: string[]; qr?: string | null };

    if (action === "stats") {
      const [{ count: cnhCount }, { count: rgCount }, { count: otherCount }, { count: pendingCount }] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").eq("doc_category", "cnh_digital"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").eq("doc_category", "rg_digital"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").eq("doc_category", "outro"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").is("doc_category", null),
      ]);
      return NextResponse.json({
        cnh_digital: cnhCount || 0,
        rg_digital: rgCount || 0,
        outro: otherCount || 0,
        pending_scan: pendingCount || 0,
      });
    }

    if (action === "next") {
      const skip = (body.skip as string[] | undefined) || [];
      let q = supabase
        .from("documents")
        .select("id, file_name, file_type")
        .eq("status", "pending_review")
        .is("doc_category", null)
        .order("created_at", { ascending: true })
        .limit(1);
      if (skip.length) q = q.not("id", "in", `(${skip.join(",")})`);
      const { data } = await q;
      return NextResponse.json({ doc: data?.[0] || null });
    }

    if (action === "list") {
      const category = body.category as string;
      let q = supabase
        .from("documents")
        .select("id, file_name, file_type, qr_data, created_at")
        .eq("status", "pending_review")
        .order("created_at", { ascending: true })
        .limit(500);
      q = category === "pending_scan" ? q.is("doc_category", null) : q.eq("doc_category", category);
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
      const category: DocCategory = qr ? classifyQr(qr) : "outro";
      const { error } = await supabase
        .from("documents")
        .update({ doc_category: category, qr_data: qr })
        .eq("id", docId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ id: docId, category });
    }

    if (action === "scan-one" && docId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("id, file_path, file_type")
        .eq("id", docId)
        .single();
      if (!doc) return NextResponse.json({ error: "Doc não encontrado." }, { status: 404 });
      if (doc.file_type !== "application/pdf") {
        await supabase.from("documents").update({ doc_category: "outro" }).eq("id", docId);
        return NextResponse.json({ id: docId, category: "outro", reason: "not_pdf" });
      }

      const { data: fileData } = await supabase.storage.from("documents").download(doc.file_path);
      if (!fileData) return NextResponse.json({ error: "Arquivo não encontrado no storage." }, { status: 404 });

      const bytes = await fileData.arrayBuffer();
      const qrText = await extractQrFromPdf(bytes);
      const category: DocCategory = qrText ? classifyQr(qrText) : "outro";

      await supabase.from("documents").update({
        doc_category: category,
        qr_data: qrText || null,
      }).eq("id", docId);

      return NextResponse.json({ id: docId, category, qr: qrText });
    }

    if (action === "scan-all") {
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_path, file_type")
        .eq("status", "pending_review")
        .is("doc_category", null)
        .eq("file_type", "application/pdf")
        .order("created_at", { ascending: true })
        .limit(50);

      if (!docs || docs.length === 0) {
        // Mark non-PDF docs as "outro"
        await supabase
          .from("documents")
          .update({ doc_category: "outro" })
          .eq("status", "pending_review")
          .is("doc_category", null)
          .neq("file_type", "application/pdf");

        return NextResponse.json({ scanned: 0, results: [] });
      }

      const results: { id: string; category: string; qr: string | null }[] = [];

      for (const doc of docs) {
        try {
          const { data: fileData } = await supabase.storage.from("documents").download(doc.file_path);
          if (!fileData) {
            results.push({ id: doc.id, category: "outro", qr: null });
            await supabase.from("documents").update({ doc_category: "outro" }).eq("id", doc.id);
            continue;
          }

          const bytes = await fileData.arrayBuffer();
          const qrText = await extractQrFromPdf(bytes);
          const category: DocCategory = qrText ? classifyQr(qrText) : "outro";

          await supabase.from("documents").update({
            doc_category: category,
            qr_data: qrText || null,
          }).eq("id", doc.id);

          results.push({ id: doc.id, category, qr: qrText });
        } catch {
          await supabase.from("documents").update({ doc_category: "outro" }).eq("id", doc.id);
          results.push({ id: doc.id, category: "outro", qr: null });
        }
      }

      const cnhCount = results.filter((r) => r.category === "cnh_digital").length;
      const rgCount = results.filter((r) => r.category === "rg_digital").length;
      return NextResponse.json({ scanned: results.length, cnh_digital: cnhCount, rg_digital: rgCount, outro: results.length - cnhCount - rgCount });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
