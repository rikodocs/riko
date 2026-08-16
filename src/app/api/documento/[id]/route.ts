import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewerId = request.nextUrl.searchParams.get("viewerId");

    if (!viewerId) {
      return NextResponse.json({ error: "viewerId obrigatório." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, file_path, file_type, assigned_to")
      .eq("id", id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.assigned_to !== viewerId) {
      return NextResponse.json({ error: "Sem acesso a este documento." }, { status: 403 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Falha ao carregar arquivo." }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const allowedType =
      doc.file_type === "application/pdf" ||
      ((doc.file_type || "").startsWith("image/") && doc.file_type !== "image/svg+xml")
        ? doc.file_type
        : "application/octet-stream";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": allowedType,
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
