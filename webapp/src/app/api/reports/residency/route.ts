import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { makeSimplePdf } from "@/lib/pdf";

export const runtime = "nodejs";

function toCsvValue(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "READ");
  if (deny) return deny;

  const rows = await db.residencyEvent.findMany({
    orderBy: { id: "desc" },
    include: { resident: { include: { household: true } } },
  });

  const headers = [
    "event_id",
    "resident_name",
    "resident_id_no",
    "household_apartment",
    "event_type",
    "from_date",
    "to_date",
    "note",
    "created_by",
  ];

  const lines = [headers.map(toCsvValue).join(",")];
  for (const e of rows) {
    lines.push(
      [
        e.id,
        e.resident.fullName,
        e.resident.idNo,
        e.resident.household.apartmentNo,
        e.eventType,
        e.fromDate.toISOString(),
        e.toDate ? e.toDate.toISOString() : "",
        e.note,
        e.createdBy,
      ]
        .map(toCsvValue)
        .join(","),
    );
  }

  const format = new URL(req.url).searchParams.get("format")?.toLowerCase() ?? "csv";
  const csv = lines.join("\n");

  if (format === "pdf") {
    const textLines = [
      ...rows.map((e) => `${e.resident.household.apartmentNo} | ${e.resident.fullName} | ${e.eventType} | ${e.fromDate.toISOString()}`),
    ];
    const pdfBuffer = await makeSimplePdf(
      "BlueMoon Residency Report",
      `Generated at ${new Date().toLocaleString("vi-VN")}`,
      textLines,
    );
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=residency_report.pdf",
      },
    });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=residency_report.csv",
    },
  });
}
