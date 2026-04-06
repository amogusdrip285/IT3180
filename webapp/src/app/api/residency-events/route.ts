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
  const rows = await db.residencyEvent.findMany({ orderBy: { id: "desc" }, skip, take });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    residentId: number;
    eventType: "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT";
    fromDate: string;
    toDate?: string;
    note: string;
    createdBy: string;
  };

  if (!Number.isFinite(body.residentId) || !body.eventType || !body.fromDate || !body.createdBy) {
    return apiError("VALIDATION_ERROR", "Invalid residency event payload", 400);
  }

  const row = await db.residencyEvent.create({
    data: {
      residentId: body.residentId,
      eventType: body.eventType,
      fromDate: new Date(body.fromDate),
      toDate: body.toDate ? new Date(body.toDate) : null,
      note: body.note || "",
      createdBy: body.createdBy,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "RESIDENCY_EVENT",
    entityId: String(row.id),
    detail: `Created residency event ${row.eventType}`,
  });

  return NextResponse.json(row);
}
