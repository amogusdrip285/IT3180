import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid period id", 400);

  const body = (await req.json()) as {
    feeTypeId?: number;
    month?: number;
    year?: number;
    status?: "OPEN" | "CLOSED";
  };

  if (body.feeTypeId != null && !Number.isFinite(body.feeTypeId)) return apiError("VALIDATION_ERROR", "Invalid fee type id", 400, { field: "feeTypeId" });
  if (body.month != null && (!Number.isInteger(body.month) || body.month < 1 || body.month > 12)) return apiError("VALIDATION_ERROR", "Invalid month", 400, { field: "month" });
  if (body.year != null && (!Number.isInteger(body.year) || body.year < 2000)) return apiError("VALIDATION_ERROR", "Invalid year", 400, { field: "year" });

  const current = await db.feePeriod.findUnique({ where: { id: num } });
  if (!current) return apiError("NOT_FOUND", "Period not found", 404);

  const nextFeeTypeId = body.feeTypeId ?? current.feeTypeId;
  const nextMonth = body.month ?? current.month;
  const nextYear = body.year ?? current.year;
  const duplicated = await db.feePeriod.findFirst({
    where: {
      feeTypeId: nextFeeTypeId,
      month: nextMonth,
      year: nextYear,
      id: { not: num },
    },
  });
  if (duplicated) {
    return apiError("DUPLICATE_DATA", "Fee period already exists", 409, { field: "monthYear" });
  }

  const row = await db.feePeriod.update({
    where: { id: num },
    data: {
      feeTypeId: body.feeTypeId,
      month: body.month,
      year: body.year,
      status: body.status,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "UPDATE",
    entity: "FEE_PERIOD",
    entityId: String(row.id),
    detail: `Changed period status to ${row.status}`,
  });

  return NextResponse.json(row);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid period id", 400);

  const [obligationCount, paymentCount] = await Promise.all([
    db.obligation.count({ where: { periodId: num } }),
    db.payment.count({ where: { obligation: { periodId: num } } }),
  ]);
  if (obligationCount > 0 || paymentCount > 0) {
    return apiError("CONSTRAINT_VIOLATION", "Cannot delete period with obligations/payments", 409, {
      obligationCount,
      paymentCount,
    });
  }

  await db.feePeriod.delete({ where: { id: num } });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "FEE_PERIOD",
    entityId: String(num),
    detail: `Deleted period id ${num}`,
  });

  return NextResponse.json({ ok: true });
}
