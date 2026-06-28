import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface TableRow {
  label: string;
  value: string;
}

function toSafePdfText(input: string): string {
  const viMap: Record<string, string> = {
    a: "áàảãạăắằẳẵặâấầẩẫậ",
    A: "ÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ",
    d: "đ",
    D: "Đ",
    e: "éèẻẽẹêếềểễệ",
    E: "ÉÈẺẼẸÊẾỀỂỄỆ",
    i: "íìỉĩị",
    I: "ÍÌỈĨỊ",
    o: "óòỏõọôốồổỗộơớờởỡợ",
    O: "ÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ",
    u: "úùủũụưứừửữự",
    U: "ÚÙỦŨỤƯỨỪỬỮỰ",
    y: "ýỳỷỹỵ",
    Y: "ÝỲỶỸỴ",
  };

  let text = input;
  for (const [ascii, chars] of Object.entries(viMap)) {
    const re = new RegExp(`[${chars}]`, "g");
    text = text.replace(re, ascii);
  }

  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...");
  return text;
}

export async function makeSimplePdf(title: string, subtitle: string, lines: string[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 36;
  const maxWidth = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;

  function drawWrappedText(text: string, size: number, bold = false, color = rgb(0, 0, 0)) {
    const safeText = toSafePdfText(text);
    const font = bold ? fontBold : fontRegular;
    const words = safeText.split(" ");
    let current = "";
    const lineHeight = size + 4;

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(next, size);
      if (width > maxWidth && current) {
        page.drawText(current, { x: margin, y, size, font, color });
        y -= lineHeight;
        current = word;
      } else {
        current = next;
      }
    }
    if (current) {
      page.drawText(current, { x: margin, y, size, font, color });
      y -= lineHeight;
    }
  }

  drawWrappedText(title, 16, true, rgb(0.1, 0.2, 0.35));
  y -= 4;
  drawWrappedText(subtitle, 10, false, rgb(0.35, 0.35, 0.35));
  y -= 6;

  for (const line of lines) {
    if (y < margin + 20) break;
    drawWrappedText(line, 10);
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function makeReceiptPdf(title: string, subtitle: string, rows: TableRow[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 36;
  const col1X = margin;
  const col2X = margin + 160;
  const rowW = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;

  function safe(text: string) { return toSafePdfText(text); }

  const lightBlue = rgb(0.9, 0.93, 0.96);
  const darkBlue = rgb(0.1, 0.2, 0.35);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.5, 0.5, 0.5);
  const borderColor = rgb(0.75, 0.75, 0.75);

  page.drawText(safe(title), { x: col1X, y, size: 16, font: fontBold, color: darkBlue });
  y -= 20;
  page.drawText(safe(subtitle), { x: col1X, y, size: 9, font: fontRegular, color: gray });
  y -= 16;

  page.drawRectangle({ x: col1X, y: y - 4, width: rowW, height: 22, color: darkBlue });
  page.drawText(safe("Thong tin"), { x: col1X + 6, y: y + 4, size: 11, font: fontBold, color: white });
  page.drawText(safe("Chi tiet"), { x: col2X + 6, y: y + 4, size: 11, font: fontBold, color: white });
  y -= 22;

  for (const row of rows) {
    if (y < margin + 20) break;
    const rowColor = (rows.indexOf(row) % 2 === 0) ? lightBlue : white;
    page.drawRectangle({ x: col1X, y: y - 4, width: rowW, height: 20, color: rowColor });
    page.drawRectangle({ x: col1X, y: y - 4, width: rowW, height: 20, borderColor, borderWidth: 0.5 });
    page.drawText(safe(row.label), { x: col1X + 6, y: y + 2, size: 10, font: fontBold, color: black });
    page.drawText(safe(row.value), { x: col2X + 6, y: y + 2, size: 10, font: fontRegular, color: black });
    y -= 20;
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
