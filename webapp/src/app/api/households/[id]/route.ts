import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { isPhone, toSafeInt, toSafeNumber } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid household id", 400);

  const body = (await req.json()) as {
    apartmentNo?: string;
    floorNo?: number;
    ownerName?: string;
    ownerPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    parkingSlots?: number;
    moveInDate?: string | null;
    ownershipStatus?: "OWNER" | "TENANT";
    contractEndDate?: string | null;
    areaM2?: number;
    status?: "ACTIVE" | "INACTIVE";
  };

  const floorNoParsed = body.floorNo == null ? undefined : toSafeInt(body.floorNo);
  const area = body.areaM2 == null ? undefined : toSafeNumber(body.areaM2);
  const parkingSlotsParsed = body.parkingSlots == null ? undefined : toSafeInt(body.parkingSlots);

  if (body.ownerPhone && !isPhone(body.ownerPhone)) return apiError("VALIDATION_ERROR", "Invalid owner phone format", 400, { field: "ownerPhone" });
  if (body.emergencyContactPhone && !isPhone(body.emergencyContactPhone)) return apiError("VALIDATION_ERROR", "Invalid emergency phone format", 400, { field: "emergencyContactPhone" });
  if (body.floorNo != null && floorNoParsed == null) return apiError("VALIDATION_ERROR", "Invalid floor number", 400, { field: "floorNo" });
  if (area != null && area <= 0) return apiError("VALIDATION_ERROR", "Invalid area", 400, { field: "areaM2" });
  if (body.parkingSlots != null && parkingSlotsParsed == null) return apiError("VALIDATION_ERROR", "Invalid parking slots", 400, { field: "parkingSlots" });
  if (parkingSlotsParsed != null && parkingSlotsParsed < 0) return apiError("VALIDATION_ERROR", "Invalid parking slots", 400, { field: "parkingSlots" });

  const floorNo = floorNoParsed == null ? undefined : floorNoParsed;
  const parkingSlots = parkingSlotsParsed == null ? undefined : parkingSlotsParsed;

  const areaM2 = area == null ? undefined : area;
  const moveInDate = body.moveInDate === null ? null : body.moveInDate ? new Date(body.moveInDate) : undefined;
  const contractEndDate = body.contractEndDate === null ? null : body.contractEndDate ? new Date(body.contractEndDate) : undefined;
  if (moveInDate && Number.isNaN(moveInDate.getTime())) return apiError("VALIDATION_ERROR", "Invalid move in date", 400, { field: "moveInDate" });
  if (contractEndDate && Number.isNaN(contractEndDate.getTime())) return apiError("VALIDATION_ERROR", "Invalid contract end date", 400, { field: "contractEndDate" });

  const row = await db.household.update({
    where: { id: num },
    data: {
      apartmentNo: body.apartmentNo,
      floorNo,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      parkingSlots,
      moveInDate,
      ownershipStatus: body.ownershipStatus,
      contractEndDate,
      areaM2,
      status: body.status,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "UPDATE",
    entity: "HOUSEHOLD",
    entityId: String(row.id),
    detail: `Updated household ${row.apartmentNo}`,
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
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid household id", 400);

  const [residentCount, obligationCount] = await Promise.all([
    db.resident.count({ where: { householdId: num } }),
    db.obligation.count({ where: { householdId: num } }),
  ]);
  if (residentCount > 0 || obligationCount > 0) {
    return apiError("CONSTRAINT_VIOLATION", "Cannot delete household with residents/obligations", 409, {
      residentCount,
      obligationCount,
    });
  }

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
