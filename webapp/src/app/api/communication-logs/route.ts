import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "READ");
  if (deny) return deny;

  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.communicationLog.findMany({
    orderBy: { sentAt: "desc" },
    skip,
    take,
    include: { household: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "RESIDENT", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    householdId: number;
    channel: "SMS" | "EMAIL" | "ZALO" | "NOTICE";
    status: "PENDING" | "SENT" | "FAILED";
    note?: string;
  };

  if (!Number.isFinite(body.householdId) || !body.channel || !body.status) {
    return apiError("VALIDATION_ERROR", "Invalid communication log payload", 400);
  }

  const row = await db.communicationLog.create({
    data: {
      householdId: body.householdId,
      channel: body.channel,
      status: body.status,
      note: body.note ?? "",
    },
    include: { household: true },
  });

  return NextResponse.json(row);
}
