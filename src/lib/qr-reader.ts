import jsQR from "jsqr";

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
let detector: Detector | null | undefined;

async function nativeScan(canvas: HTMLCanvasElement): Promise<string | null> {
  if (detector === undefined) {
    const BD = (globalThis as unknown as { BarcodeDetector?: new (o: object) => Detector }).BarcodeDetector;
    detector = BD ? new BD({ formats: ["qr_code"] }) : null;
  }
  if (!detector) return null;
  try {
    const found = await detector.detect(canvas);
    return found[0]?.rawValue || null;
  } catch {
    return null;
  }
}

async function scanAny(canvas: HTMLCanvasElement): Promise<string | null> {
  return (await nativeScan(canvas)) || scanCanvas(canvas);
}

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

export interface DocScan { qr: string | null; text: string }

async function readPdf(bytes: ArrayBuffer): Promise<DocScan> {
  const pdfjsLib = await import("pdfjs-dist");
  await ensureWorker(pdfjsLib);
  const pdf = await pdfjsLib.getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false }).promise;
  try {
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const text = content.items
      .map((i) => ("str" in i ? i.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 4000);
    for (const scale of [2, 3.5]) {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      const qr = await scanAny(canvas);
      if (qr) return { qr, text };
    }
    return { qr: null, text };
  } finally {
    pdf.destroy();
  }
}

async function readImage(blob: Blob): Promise<DocScan> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  return { qr: await scanAny(canvas), text: "" };
}

export async function fetchDocBlob(docId: string): Promise<Blob> {
  const r = await fetch(`/api/documento/${docId}?viewerId=admin&admin=true`);
  if (!r.ok) throw new Error(`download falhou (${r.status})`);
  return r.blob();
}

export async function readQrFromBlob(blob: Blob, fileType: string): Promise<DocScan> {
  if (fileType === "application/pdf") return readPdf(await blob.arrayBuffer());
  if (fileType.startsWith("image/")) return readImage(blob);
  return { qr: null, text: "" };
}
