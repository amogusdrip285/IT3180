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
  const rows = await db.feeType.findMany({ orderBy: { id: "asc" }, skip, take });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    code: string;
    name: string;
    category: "MANDATORY" | "VOLUNTARY";
    calcMethod: "PER_M2" | "FIXED";
    rate: number;
    graceDays?: number;
    lateFeeRule?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    policyNote?: string;
  };
  if (!body.code || !body.name || !Number.isFinite(body.rate) || body.rate <= 0) {
    return apiError("VALIDATION_ERROR", "Invalid fee type payload", 400);
  }
  const graceDays = body.graceDays == null ? 0 : Number(body.graceDays);
  if (!Number.isInteger(graceDays) || graceDays < 0) {
    return apiError("VALIDATION_ERROR", "Invalid grace days", 400, { field: "graceDays" });
  }
  const effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : null;
  const effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : null;
  if (effectiveFrom && Number.isNaN(effectiveFrom.getTime())) {
    return apiError("VALIDATION_ERROR", "Invalid effective from date", 400, { field: "effectiveFrom" });
  }
  if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
    return apiError("VALIDATION_ERROR", "Invalid effective to date", 400, { field: "effectiveTo" });
  }
  const row = await db.feeType.create({
    data: {
      code: body.code,
      name: body.name,
      category: body.category,
      calcMethod: body.calcMethod,
      rate: body.rate,
      graceDays,
      lateFeeRule: body.lateFeeRule ?? "",
      effectiveFrom,
      effectiveTo,
      policyNote: body.policyNote ?? "",
      active: true,
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "FEE_TYPE",
    entityId: String(row.id),
    detail: `Created fee type ${row.code}`,
  });

  return NextResponse.json(row);
}
