import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "LOG");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.vehicleLog.findMany({
    orderBy: { timestamp: "desc" },
    skip, take,
    include: {
      vehicle: {
        include: { household: { select: { apartmentNo: true } } },
      },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "LOG");
  if (deny) return deny;

  const body = (await req.json()) as {
    vehicleId: number;
    direction: "IN" | "OUT";
    timestamp?: string;
    note?: string;
  };
  if (!body.vehicleId || !body.direction) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }

  const row = await db.vehicleLog.create({
    data: {
      vehicleId: body.vehicleId,
      direction: body.direction,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      note: body.note || "",
    },
  });
  return NextResponse.json(row);
}
