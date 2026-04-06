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
  const rows = await db.obligation.findMany({ orderBy: { id: "asc" }, skip, take, include: { period: true, household: true } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as { periodId: number; householdId: number; amountDue: number };
  if (!Number.isFinite(body.periodId) || !Number.isFinite(body.householdId) || !Number.isFinite(body.amountDue)) {
    return apiError("VALIDATION_ERROR", "Invalid obligation payload", 400);
  }
  const row = await db.obligation.create({
    data: {
      periodId: body.periodId,
      householdId: body.householdId,
      amountDue: body.amountDue,
      amountPaid: 0,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "OBLIGATION",
    entityId: String(row.id),
    detail: `Created obligation ${row.id}`,
  });

  return NextResponse.json(row);
}
