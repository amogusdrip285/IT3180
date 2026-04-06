import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return apiError("VALIDATION_ERROR", "Invalid user id", 400);

  const body = (await req.json()) as { roleIds: number[] };
  if (!Array.isArray(body.roleIds)) return apiError("VALIDATION_ERROR", "roleIds must be an array", 400);

  await db.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    if (body.roleIds.length > 0) {
      await tx.userRole.createMany({
        data: body.roleIds.map((roleId) => ({ userId, roleId })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
