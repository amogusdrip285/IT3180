import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { isPhone, parsePagination, toSafeInt, toSafeNumber } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "READ");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.household.findMany({ orderBy: { id: "asc" }, skip, take });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    apartmentNo: string;
    floorNo: number;
    ownerName: string;
    ownerPhone: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    parkingSlots?: number;
    moveInDate?: string;
    ownershipStatus?: "OWNER" | "TENANT";
    contractEndDate?: string;
    areaM2: number;
  };
  const floorNo = toSafeInt(body.floorNo);
  const area = toSafeNumber(body.areaM2);
  const parkingSlots = body.parkingSlots == null ? 0 : toSafeInt(body.parkingSlots);
  if (!body.apartmentNo || !floorNo || !body.ownerName || !body.ownerPhone || !area || area <= 0) {
    return apiError("VALIDATION_ERROR", "Invalid household payload", 400);
  }
  const existingApartment = await db.household.findUnique({ where: { apartmentNo: body.apartmentNo } });
  if (existingApartment) {
    return apiError("DUPLICATE_DATA", "Apartment number already exists", 409, { field: "apartmentNo" });
  }
  if (parkingSlots == null || parkingSlots < 0) {
    return apiError("VALIDATION_ERROR", "Invalid parking slots", 400, { field: "parkingSlots" });
  }
  if (!isPhone(body.ownerPhone)) {
    return apiError("VALIDATION_ERROR", "Invalid owner phone format", 400, { field: "ownerPhone" });
  }
  if (body.emergencyContactPhone && !isPhone(body.emergencyContactPhone)) {
    return apiError("VALIDATION_ERROR", "Invalid emergency phone format", 400, { field: "emergencyContactPhone" });
  }
  const moveInDate = body.moveInDate ? new Date(body.moveInDate) : null;
  const contractEndDate = body.contractEndDate ? new Date(body.contractEndDate) : null;
  if (moveInDate && Number.isNaN(moveInDate.getTime())) {
    return apiError("VALIDATION_ERROR", "Invalid move in date", 400, { field: "moveInDate" });
  }
  if (contractEndDate && Number.isNaN(contractEndDate.getTime())) {
    return apiError("VALIDATION_ERROR", "Invalid contract end date", 400, { field: "contractEndDate" });
  }
  const row = await db.household.create({
    data: {
      apartmentNo: body.apartmentNo,
      floorNo,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      parkingSlots,
      moveInDate,
      ownershipStatus: body.ownershipStatus ?? "OWNER",
      contractEndDate,
      areaM2: area,
      status: "ACTIVE",
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "HOUSEHOLD",
    entityId: String(row.id),
    detail: `Created household ${row.apartmentNo}`,
  });

  return NextResponse.json(row);
}
