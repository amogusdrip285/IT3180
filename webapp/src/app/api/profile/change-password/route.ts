import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isStrongPassword } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = (await req.json()) as { oldPassword: string; newPassword: string };
  if (!body.oldPassword || !body.newPassword) return apiError("VALIDATION_ERROR", "Missing password fields", 400);
  if (!isStrongPassword(body.newPassword)) return apiError("VALIDATION_ERROR", "Password is too weak", 400, { field: "newPassword" });

  const user = await db.user.findUnique({ where: { id: auth.user!.id } });
  if (!user) return apiError("NOT_FOUND", "User not found", 404);

  const ok = verifyPassword(body.oldPassword, user.passwordHash);
  if (!ok) return apiError("AUTH_INVALID_CREDENTIALS", "Current password is incorrect", 401);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(body.newPassword), failedLoginCount: 0, lockedUntil: null },
  });

  return NextResponse.json({ ok: true });
}
