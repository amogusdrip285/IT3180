import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { isPhone } from "@/lib/validation";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return apiError("VALIDATION_ERROR", "Invalid user id", 400);

  const body = (await req.json()) as {
    fullName?: string;
    phone?: string;
    role?: "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER";
    status?: "ACTIVE" | "BLOCKED";
  };

  if (body.phone && !isPhone(body.phone)) {
    return apiError("VALIDATION_ERROR", "Invalid phone format", 400, { field: "phone" });
  }

  const action = body.status === "BLOCKED" ? "LOCK" : body.status === "ACTIVE" ? "UNLOCK" : "UPDATE";

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      fullName: body.fullName,
      phone: body.phone,
      role: body.role,
      status: body.status,
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      userRoles: {
        include: {
          role: true,
        },
      },
      status: true,
      createdAt: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (body.role) {
    const mapped = await db.appRole.findUnique({ where: { code: body.role } });
    if (mapped) {
      await db.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.create({ data: { userId, roleId: mapped.id } });
      });
    }
  }

  await writeAudit({
    actorUserId: auth.user!.id,
    action,
    entity: "USER",
    entityId: String(updated.id),
    detail: `Updated user ${updated.username}`,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return apiError("VALIDATION_ERROR", "Invalid user id", 400);

  await db.user.delete({ where: { id: userId } });
  await writeAudit({
    actorUserId: auth.user!.id,
    action: "DELETE",
    entity: "USER",
    entityId: String(userId),
    detail: `Deleted user id ${userId}`,
  });
  return NextResponse.json({ ok: true });
}
