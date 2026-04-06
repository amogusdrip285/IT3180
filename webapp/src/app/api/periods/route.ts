import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "READ");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.feePeriod.findMany({ orderBy: { id: "asc" }, skip, take });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as { feeTypeId: number; month: number; year: number };
  if (!Number.isFinite(body.feeTypeId) || !Number.isFinite(body.month) || !Number.isFinite(body.year)) {
    return apiError("VALIDATION_ERROR", "Invalid period payload", 400);
  }
  const row = await db.feePeriod.create({
    data: { feeTypeId: body.feeTypeId, month: body.month, year: body.year, status: "OPEN" },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "FEE_PERIOD",
    entityId: String(row.id),
    detail: `Created period ${row.month}/${row.year}`,
  });

  return NextResponse.json(row);
}
