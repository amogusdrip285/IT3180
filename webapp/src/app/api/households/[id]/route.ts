import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid household id", 400);
  await db.household.delete({ where: { id: num } });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "HOUSEHOLD",
    entityId: String(num),
    detail: `Deleted household id ${num}`,
  });

  return NextResponse.json({ ok: true });
}
