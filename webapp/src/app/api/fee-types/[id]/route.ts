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
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid fee type id", 400);
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
