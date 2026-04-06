import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const rows = await db.permission.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const body = (await req.json()) as {
    code: string;
    name: string;
    module: string;
    screen?: string;
    description?: string;
  };

  if (!body.code || !/^[A-Z0-9_]{3,50}$/.test(body.code)) {
    return apiError("VALIDATION_ERROR", "Invalid permission code", 400, { field: "code" });
  }
  if (!body.name || !body.module) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }

  const row = await db.permission.create({
    data: {
      code: body.code,
      name: body.name,
      module: body.module,
      screen: body.screen ?? "",
      description: body.description ?? "",
    },
  });
  return NextResponse.json(row);
}
