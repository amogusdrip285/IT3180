import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { isStrongPassword } from "@/lib/validation";
import { apiError } from "@/lib/errors";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return apiError("VALIDATION_ERROR", "Invalid user id", 400);

  const body = (await req.json()) as { newPassword: string };
  if (!body.newPassword || !isStrongPassword(body.newPassword)) {
    return apiError("VALIDATION_ERROR", "Password is too weak", 400, { field: "newPassword" });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(body.newPassword) },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "RESET_PASSWORD",
    entity: "USER",
    entityId: String(updated.id),
    detail: `Reset password for ${updated.username}`,
  });

  return NextResponse.json({ ok: true });
}
