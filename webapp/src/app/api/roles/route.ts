import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const rows = await db.appRole.findMany({
    orderBy: { code: "asc" },
    include: {
      permissions: { include: { permission: true } },
      userRoles: true,
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const body = (await req.json()) as { code: string; name: string; description?: string };
  if (!body.code || !/^[A-Z0-9_]{3,50}$/.test(body.code)) return apiError("VALIDATION_ERROR", "Invalid role code", 400, { field: "code" });
  if (!body.name) return apiError("VALIDATION_ERROR", "Missing role name", 400, { field: "name" });

  const row = await db.appRole.create({ data: { code: body.code, name: body.name, description: body.description ?? "" } });
  return NextResponse.json(row);
}
