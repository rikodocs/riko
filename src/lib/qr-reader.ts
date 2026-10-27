import jsQR from "jsqr";

function scanCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height, { inversionAttempts: "attemptBoth" })?.data || null;
}

async function ensureWorker(pdfjsLib: typeof import("pdfjs-dist")) {
  if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;
  const workerBlob = new Blob(
    [await (await fetch("/pdf.worker.min.mjs")).text()],
    { type: "application/javascript" }
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
}

async function readPdf(bytes: ArrayBuffer): Promise<string | null> {
  const pdfjsLib = await import("pdfjs-dist");
  await ensureWorker(pdfjsLib);
  const pdf = await pdfjsLib.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false }).promise;
  try {
    const page = await pdf.getPage(1);
    for (const scale of [2, 3.5]) {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      const qr = scanCanvas(canvas);
      if (qr) return qr;
    }
    return null;
  } finally {
    pdf.destroy();
  }
}

async function readImage(blob: Blob): Promise<string | null> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  return scanCanvas(canvas);
}

export async function readQrFromDoc(docId: string, fileType: string): Promise<string | null> {
  const r = await fetch(`/api/documento/${docId}?viewerId=admin&admin=true`);
  if (!r.ok) throw new Error(`download falhou (${r.status})`);
  const blob = await r.blob();
  if (fileType === "application/pdf") return readPdf(await blob.arrayBuffer());
  if (fileType.startsWith("image/")) return readImage(blob);
  return null;
}
