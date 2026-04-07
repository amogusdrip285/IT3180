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
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid fee type id", 400);

  const body = (await req.json()) as {
    code?: string;
    name?: string;
    category?: "MANDATORY" | "VOLUNTARY";
    calcMethod?: "PER_M2" | "FIXED";
    rate?: number;
    graceDays?: number;
    lateFeeRule?: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    policyNote?: string;
    active?: boolean;
  };

  const effectiveFrom = body.effectiveFrom === null ? null : body.effectiveFrom ? new Date(body.effectiveFrom) : undefined;
  const effectiveTo = body.effectiveTo === null ? null : body.effectiveTo ? new Date(body.effectiveTo) : undefined;
  if (effectiveFrom && Number.isNaN(effectiveFrom.getTime())) return apiError("VALIDATION_ERROR", "Invalid effective from date", 400, { field: "effectiveFrom" });
  if (effectiveTo && Number.isNaN(effectiveTo.getTime())) return apiError("VALIDATION_ERROR", "Invalid effective to date", 400, { field: "effectiveTo" });

  const row = await db.feeType.update({
    where: { id: num },
    data: {
      code: body.code,
      name: body.name,
      category: body.category,
      calcMethod: body.calcMethod,
      rate: body.rate,
      graceDays: body.graceDays,
      lateFeeRule: body.lateFeeRule,
      effectiveFrom,
      effectiveTo,
      policyNote: body.policyNote,
      active: body.active,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "UPDATE",
    entity: "FEE_TYPE",
    entityId: String(row.id),
    detail: `Updated fee type ${row.code}`,
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
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid fee type id", 400);

  const [periodCount, paymentCount] = await Promise.all([
    db.feePeriod.count({ where: { feeTypeId: num } }),
    db.payment.count({ where: { feeTypeId: num } }),
  ]);
  if (periodCount > 0 || paymentCount > 0) {
    return apiError("CONSTRAINT_VIOLATION", "Cannot delete fee type with related periods/payments", 409, {
      periodCount,
      paymentCount,
    });
  }

  await db.feeType.delete({ where: { id: num } });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "FEE_TYPE",
    entityId: String(num),
    detail: `Deleted fee type id ${num}`,
  });

  return NextResponse.json({ ok: true });
}
