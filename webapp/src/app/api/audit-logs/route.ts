import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { skip, take } = parsePagination(req.nextUrl.searchParams);

  const rows = await db.auditLog.findMany({
    orderBy: { id: "desc" },
    skip,
    take,
    include: { actor: true },
  });
  return NextResponse.json(rows);
}
