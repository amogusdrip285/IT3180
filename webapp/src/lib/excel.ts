import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export async function makeExcelBuffer(
  title: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BlueMoon";
  const sheet = workbook.addWorksheet(title, {
    views: [{ showGridLines: false }],
  });

  const titleRow = sheet.addRow([title]);
  titleRow.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1A3A5C" } };
  sheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);
  sheet.addRow([]);

  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A5C" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width ?? 15;
  });

  rows.forEach((row) => {
    const dataRow = sheet.addRow(columns.map((c) => row[c.key] ?? ""));
    dataRow.font = { name: "Calibri", size: 10 };
    dataRow.alignment = { vertical: "middle" };
    if (dataRow.number % 2 === 0) {
      dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7FB" } };
    }
  });

  const dataArea = sheet.getRows(3, rows.length + 1);
  if (dataArea) {
    dataArea.forEach((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
