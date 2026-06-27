import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.vehicle.findMany({
    orderBy: { id: "desc" },
    skip, take,
    include: { household: { select: { apartmentNo: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    householdId: number;
    licensePlate: string;
    vehicleType: "CAR" | "MOTORBIKE" | "BICYCLE" | "OTHER";
    brand?: string;
    color?: string;
    note?: string;
  };
  if (!body.householdId || !body.licensePlate || !body.vehicleType) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }
  const existing = await db.vehicle.findUnique({ where: { licensePlate: body.licensePlate } });
  if (existing) return apiError("DUPLICATE_DATA", "License plate already exists", 409);

  const row = await db.vehicle.create({
    data: {
      householdId: body.householdId,
      licensePlate: body.licensePlate.toUpperCase(),
      vehicleType: body.vehicleType,
      brand: body.brand || null,
      color: body.color || null,
      note: body.note || "",
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "VEHICLE",
    entityId: String(row.id),
    detail: `Created vehicle ${row.licensePlate}`,
  });

  return NextResponse.json(row);
}
