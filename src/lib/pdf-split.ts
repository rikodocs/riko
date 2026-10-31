import { PDFDocument } from "pdf-lib";

export async function splitPdfPages(file: File): Promise<File[]> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  if (pageCount <= 1) return [file];

  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: File[] = [];
  for (let i = 0; i < pageCount; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(pdf, [i]);
    single.addPage(page);
    const singleBytes = await single.save();
    results.push(
      new File([singleBytes.buffer as ArrayBuffer], `${baseName}_p${i + 1}.pdf`, { type: "application/pdf" })
    );
  }
  return results;
}
