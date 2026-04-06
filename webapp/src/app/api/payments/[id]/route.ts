import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid payment id", 400);

  const target = await db.payment.findUnique({ where: { id: num } });
  if (!target) return apiError("NOT_FOUND", "Payment not found", 404);

  await db.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: num } });
    const obligation = await tx.obligation.findUnique({ where: { id: target.obligationId } });
    if (obligation) {
      await tx.obligation.update({
        where: { id: obligation.id },
        data: { amountPaid: Math.max(0, obligation.amountPaid - target.paidAmount) },
      });
    }
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "PAYMENT",
    entityId: String(num),
    detail: `Deleted payment id ${num}`,
  });

  return NextResponse.json({ ok: true });
}
