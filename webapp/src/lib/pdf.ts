import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
