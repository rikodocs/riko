import { NextResponse } from "next/server";

// Proxy para instância local do OpenJutsu (porta padrão 3000 do Next.js dele).
// Se rodar em outra porta/máquina, configure OPENJUTSU_URL no .env.
const BASE = process.env.OPENJUTSU_URL || "http://localhost:3000";
const PASSWORD = process.env.OPENJUTSU_PASSWORD || "";

function authHeaders(): Record<string, string> {
  if (!PASSWORD) return {};
  return { Authorization: `Basic ${Buffer.from(`openjutsu:${PASSWORD}`).toString("base64")}` };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === "status") {
      try {
        const res = await fetch(BASE, { headers: authHeaders(), signal: AbortSignal.timeout(5000) });
        return NextResponse.json({ online: res.ok });
      } catch {
        return NextResponse.json({ online: false });
      }
    }

    if (action === "generate") {
      const { videoUrl, photoUrl, settings } = body;

      const [videoRes, photoRes] = await Promise.all([fetch(videoUrl), fetch(photoUrl)]);
      if (!videoRes.ok || !photoRes.ok) {
        return NextResponse.json({ error: "Falha ao baixar os arquivos." }, { status: 400 });
      }

      const formData = new FormData();
      formData.append("video", await videoRes.blob(), "video.mp4");
      formData.append("photo", await photoRes.blob(), "photo.jpg");
      formData.append("settings", JSON.stringify(settings || {}));

      const res = await fetch(`${BASE}/api/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        return NextResponse.json({ error: (await res.text()) || "Erro no OpenJutsu" }, { status: res.status });
      }
      return NextResponse.json(await res.json());
    }

    if (action === "job-status") {
      const res = await fetch(`${BASE}/api/jobs/${body.jobId}`, { headers: authHeaders() });
      if (!res.ok) return NextResponse.json({ error: "Job nao encontrado" }, { status: 404 });
      return NextResponse.json(await res.json());
    }

    if (action === "list-jobs") {
      try {
        const res = await fetch(`${BASE}/api/jobs`, { headers: authHeaders() });
        if (!res.ok) return NextResponse.json({ jobs: [] });
        return NextResponse.json(await res.json());
      } catch {
        return NextResponse.json({ jobs: [] });
      }
    }

    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
