import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { makeSimplePdf } from "@/lib/pdf";

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
  const householdIdParam = searchParams.get("householdId");
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  const householdId = householdIdParam ? Number(householdIdParam) : null;
  if (householdIdParam && !Number.isFinite(householdId)) {
    return apiError("VALIDATION_ERROR", "Invalid household id", 400);
  }

  const rows = await db.obligation.findMany({
    where: householdId ? { householdId } : undefined,
    orderBy: [{ householdId: "asc" }, { id: "asc" }],
    include: {
      household: true,
      period: { include: { feeType: true } },
    },
  });

  const debtRows = rows
    .map((o) => ({
      obligationId: o.id,
      householdId: o.householdId,
      apartmentNo: o.household.apartmentNo,
      ownerName: o.household.ownerName,
      periodLabel: `${o.period.month}/${o.period.year}`,
      feeName: o.period.feeType.name,
      amountDue: o.amountDue,
      amountPaid: o.amountPaid,
      outstanding: Math.max(0, o.amountDue - o.amountPaid),
    }))
    .filter((x) => x.outstanding > 0);

  const headers = [
    "obligation_id",
    "household_id",
    "apartment_no",
    "owner_name",
    "period",
    "fee_name",
    "amount_due",
    "amount_paid",
    "outstanding",
  ];

  const lines = [headers.map(toCsvValue).join(",")];
  for (const row of debtRows) {
    lines.push(
      [
        row.obligationId,
        row.householdId,
        row.apartmentNo,
        row.ownerName,
        row.periodLabel,
        row.feeName,
        row.amountDue,
        row.amountPaid,
        row.outstanding,
      ]
        .map(toCsvValue)
        .join(","),
    );
  }

  const generatedAt = new Date().toLocaleString("vi-VN");
  if (format === "pdf") {
    const title = householdId ? `BlueMoon Debt Summary - Household ${householdId}` : "BlueMoon Debt Summary";
    const subtitle = `Generated at ${generatedAt}`;
    const textLines = debtRows.length
      ? debtRows.map((r) => `${r.apartmentNo} | ${r.feeName} | ${r.periodLabel} | debt ${r.outstanding}`)
      : ["No outstanding debt"];
    const pdfBuffer = await makeSimplePdf(title, subtitle, textLines);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": householdId
          ? `attachment; filename=debt_summary_household_${householdId}.pdf`
          : "attachment; filename=debt_summary.pdf",
      },
    });
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": householdId
        ? `attachment; filename=debt_summary_household_${householdId}.csv`
        : "attachment; filename=debt_summary.csv",
    },
  });
}
