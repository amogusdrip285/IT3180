import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid permission id", 400);

  const body = (await req.json()) as { name?: string; module?: string; screen?: string; description?: string };
  const row = await db.permission.update({
    where: { id: num },
    data: {
      name: body.name,
      module: body.module,
      screen: body.screen,
      description: body.description,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) return apiError("VALIDATION_ERROR", "Invalid permission id", 400);

  await db.permission.delete({ where: { id: num } });
  return NextResponse.json({ ok: true });
}
