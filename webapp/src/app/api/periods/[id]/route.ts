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

  const body = (await req.json()) as { status?: "OPEN" | "CLOSED" };
  const row = await db.feePeriod.update({
    where: { id: num },
    data: { status: body.status },
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
