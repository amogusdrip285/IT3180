import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid id", 400);

  const body = (await req.json()) as {
    licensePlate?: string;
    vehicleType?: "CAR" | "MOTORBIKE" | "BICYCLE" | "OTHER";
    brand?: string;
    color?: string;
    note?: string;
  };

  const row = await db.vehicle.update({ where: { id: num }, data: body });
  await writeAudit({ actorUserId: auth.user!.id, action: "UPDATE", entity: "VEHICLE", entityId: String(row.id), detail: `Updated vehicle ${row.licensePlate}` });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid id", 400);
  await db.vehicle.delete({ where: { id: num } });
  await writeAudit({ actorUserId: auth.user!.id, action: "DELETE", entity: "VEHICLE", entityId: String(num), detail: `Deleted vehicle id ${num}` });
  return NextResponse.json({ ok: true });
}
