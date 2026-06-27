import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { makeSimplePdf } from "@/lib/pdf";
import { makeExcelBuffer } from "@/lib/excel";

export const runtime = "nodejs";

function toCsvValue(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "REPORT", "READ");
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const categoryParam = searchParams.get("category");
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  const month = monthParam ? Number(monthParam) : null;
  const year = yearParam ? Number(yearParam) : null;

  const rows = await db.payment.findMany({
    orderBy: { paidAt: "desc" },
    where: {
      ...(month ? { obligation: { period: { month } } } : {}),
      ...(year ? { obligation: { period: { year } } } : {}),
      ...(categoryParam && categoryParam !== "all" ? { feeType: { category: categoryParam as "MANDATORY" | "VOLUNTARY" } } : {}),
    },
    include: {
      feeType: true,
      obligation: {
        include: {
          period: true,
          household: true,
        },
      },
    },
  });

  const filtered = rows;

  const headers = [
    "payment_id",
    "receipt_no",
    "paid_at",
    "collector_name",
    "apartment_no",
    "owner_name",
    "fee_type",
    "fee_category",
    "period_month",
    "period_year",
    "paid_amount",
    "method",
    "note",
  ];

  const lines = [headers.map(toCsvValue).join(",")];
  for (const p of filtered) {
    const period = p.obligation.period;
    lines.push(
      [
        p.id,
        p.receiptNo,
        p.paidAt.toISOString(),
        p.collectorName,
        p.obligation.household.apartmentNo,
        p.obligation.household.ownerName,
        p.feeType.name,
        p.feeType.category,
        period.month,
        period.year,
        p.paidAmount,
        p.method,
        p.note,
      ]
        .map(toCsvValue)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  if (format === "pdf") {
    const textLines = [
      "BlueMoon Payment Summary",
      `Generated at: ${new Date().toISOString()}`,
      "",
      ...filtered.map((p) => {
        const period = p.obligation.period;
        return `${p.receiptNo} | ${period.month}/${period.year} | ${p.feeType.name} | ${p.paidAmount} | ${p.method}`;
      }),
    ];

    const pdfBuffer = await makeSimplePdf(
      "BlueMoon Payment Report",
      `Generated at ${new Date().toLocaleString("vi-VN")}`,
      textLines,
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=payment_report.pdf",
      },
    });
  }

  if (format === "xlsx") {
    const buffer = await makeExcelBuffer(
      "Báo cáo thu phí BlueMoon",
      [
        { header: "Mã phiếu thu", key: "receiptNo", width: 18 },
        { header: "Ngày thu", key: "paidAt", width: 20 },
        { header: "Người thu", key: "collector", width: 20 },
        { header: "Căn hộ", key: "apartment", width: 12 },
        { header: "Khoản phí", key: "feeType", width: 20 },
        { header: "Số tiền", key: "amount", width: 15 },
        { header: "Phương thức", key: "method", width: 12 },
        { header: "Ghi chú", key: "note", width: 25 },
      ],
      filtered.map((p) => ({
          receiptNo: p.receiptNo,
          paidAt: p.paidAt.toLocaleString("vi-VN"),
          collector: p.collectorName,
          apartment: p.obligation.household.apartmentNo,
          feeType: p.feeType.name,
          amount: p.paidAmount.toLocaleString("vi-VN") + " VND",
          method: p.method === "CASH" ? "Tiền mặt" : "Chuyển khoản",
          note: p.note,
        })),
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=payment_report.xlsx",
      },
    });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=payment_report.csv",
    },
  });
}
