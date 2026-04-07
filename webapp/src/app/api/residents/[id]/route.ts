import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid resident id", 400);

  const body = (await req.json()) as {
    householdId?: number;
    fullName?: string;
    dob?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    idNo?: string;
    residentType?: "PERMANENT" | "TEMPORARY";
  };

  const dob = body.dob ? new Date(body.dob) : undefined;
  if (dob && Number.isNaN(dob.getTime())) return apiError("VALIDATION_ERROR", "Invalid date of birth", 400, { field: "dob" });

  const row = await db.resident.update({
    where: { id: num },
    data: {
      householdId: body.householdId,
      fullName: body.fullName,
      dob,
      gender: body.gender,
      idNo: body.idNo,
      residentType: body.residentType,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "UPDATE",
    entity: "RESIDENT",
    entityId: String(row.id),
    detail: `Updated resident ${row.fullName}`,
  });

  return NextResponse.json(row);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid resident id", 400);

  const eventCount = await db.residencyEvent.count({ where: { residentId: num } });
  if (eventCount > 0) {
    return apiError("CONSTRAINT_VIOLATION", "Cannot delete resident with residency events", 409, { eventCount });
  }

  await db.resident.delete({ where: { id: num } });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "RESIDENT",
    entityId: String(num),
    detail: `Deleted resident id ${num}`,
  });

  return NextResponse.json({ ok: true });
}
