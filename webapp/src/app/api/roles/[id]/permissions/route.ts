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
  const roleId = Number(id);
  if (!Number.isFinite(roleId)) return apiError("VALIDATION_ERROR", "Invalid role id", 400);

  const body = (await req.json()) as { permissionIds: number[] };
  if (!Array.isArray(body.permissionIds)) return apiError("VALIDATION_ERROR", "permissionIds must be an array", 400);

  await db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (body.permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: body.permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
