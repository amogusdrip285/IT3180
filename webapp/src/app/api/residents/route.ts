import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "READ");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.resident.findMany({ orderBy: { id: "asc" }, skip, take });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    householdId: number;
    fullName: string;
    dob: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    idNo: string;
    residentType: "PERMANENT" | "TEMPORARY";
  };
  if (!body.fullName || !Number.isFinite(body.householdId) || !body.dob || !body.gender || !body.idNo) {
    return apiError("VALIDATION_ERROR", "Invalid resident payload", 400);
  }
  const row = await db.resident.create({
    data: {
      householdId: body.householdId,
      fullName: body.fullName,
      dob: new Date(body.dob),
      gender: body.gender,
      idNo: body.idNo,
      residentType: body.residentType ?? "PERMANENT",
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "RESIDENT",
    entityId: String(row.id),
    detail: `Created resident ${row.fullName}`,
  });

  return NextResponse.json(row);
}
