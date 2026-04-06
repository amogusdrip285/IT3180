import PDFDocument from "pdfkit";

export async function makeSimplePdf(title: string, subtitle: string, lines: string[]): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(subtitle);
    doc.moveDown(0.8);
    doc.fillColor("#000");

    for (const line of lines) {
      doc.fontSize(10).text(line, { width: 520 });
      doc.moveDown(0.2);
    }

    doc.end();
  });
}
