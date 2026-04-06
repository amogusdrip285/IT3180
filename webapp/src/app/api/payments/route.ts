import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "READ");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.payment.findMany({ orderBy: { id: "desc" }, skip, take, include: { feeType: true, obligation: { include: { period: true, household: true } } } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    obligationId: number;
    paidAmount: number;
    method: "CASH" | "BANK";
    collectorName: string;
    note: string;
    payerName?: string;
    payerPhone?: string;
    bankTxRef?: string;
    attachmentUrl?: string;
    reversalNote?: string;
  };
  if (!Number.isFinite(body.obligationId) || !Number.isFinite(body.paidAmount) || body.paidAmount <= 0) {
    return apiError("VALIDATION_ERROR", "Invalid payment payload", 400);
  }

  const obligation = await db.obligation.findUnique({ where: { id: body.obligationId }, include: { period: true } });
  if (!obligation) return apiError("NOT_FOUND", "Obligation not found", 404);

  const remaining = Math.max(0, obligation.amountDue - obligation.amountPaid);
  const applied = Math.min(remaining, body.paidAmount);
  if (applied <= 0) return apiError("NO_REMAINING", "No remaining amount to collect", 400);

  const result = await db.$transaction(async (tx) => {
    const latest = await tx.payment.findFirst({ orderBy: { id: "desc" } });
    const nextNo = (latest?.id ?? 0) + 1;
    const now = new Date();
    const receiptNo = `PT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(nextNo).padStart(5, "0")}`;

    const payment = await tx.payment.create({
      data: {
        obligationId: obligation.id,
        feeTypeId: obligation.period.feeTypeId,
        paidAmount: applied,
        method: body.method,
        collectorName: body.collectorName || "Không rõ",
        payerName: body.payerName || "",
        payerPhone: body.payerPhone || "",
        bankTxRef: body.bankTxRef || "",
        attachmentUrl: body.attachmentUrl || "",
        reversalNote: body.reversalNote || "",
        receiptNo,
        note: body.note || "",
      },
    });
    await tx.obligation.update({
      where: { id: obligation.id },
      data: { amountPaid: obligation.amountPaid + applied },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: auth.user!.id,
        action: "COLLECT_PAYMENT",
        entity: "PAYMENT",
        entityId: String(payment.id),
        detail: `Collected ${applied} for obligation ${obligation.id}`,
      },
    });

    return payment;
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "COLLECT_PAYMENT",
    entity: "PAYMENT",
    entityId: String(result.id),
    detail: `Collected payment ${result.receiptNo}`,
  });

  return NextResponse.json(result);
}
