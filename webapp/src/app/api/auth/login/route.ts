import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { verifyPassword } from "@/lib/password";
import { apiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { usernameOrEmail: string; password: string };
  const id = (body.usernameOrEmail ?? "").trim();
  const pwd = body.password ?? "";

  if (!id || !pwd) return apiError("VALIDATION_ERROR", "Missing credentials", 400);

  const user = await db.user.findFirst({
    where: {
      OR: [{ username: id }, { email: id }],
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return apiError("AUTH_INVALID_CREDENTIALS", "Invalid credentials", 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return apiError("AUTH_BLOCKED", "Account temporarily locked", 403);
  }

  const ok = verifyPassword(pwd, user.passwordHash);
  if (!ok) {
    const nextFailed = user.failedLoginCount + 1;
    const shouldLock = nextFailed >= 5;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : nextFailed,
        lockedUntil: shouldLock ? new Date(Date.now() + 1000 * 60 * 10) : null,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: shouldLock ? "LOCK" : "UPDATE",
      entity: "USER",
      entityId: String(user.id),
      detail: shouldLock ? "Locked account due to failed logins" : "Failed login attempt",
    });
    return apiError("AUTH_INVALID_CREDENTIALS", "Invalid credentials", 401);
  }

  if (user.status !== "ACTIVE") {
    return apiError("AUTH_BLOCKED", "Account blocked", 403);
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  await db.session.create({ data: { userId: user.id, token, expiresAt } });
  await writeAudit({
    actorUserId: user.id,
    action: "LOGIN",
    entity: "USER",
    entityId: String(user.id),
    detail: `User ${user.username} logged in`,
  });

  const roleCodes = user.userRoles.map((x) => x.role.code);
  const permissionCodes = Array.from(
    new Set(
      user.userRoles.flatMap((x) => x.role.permissions.map((rp) => rp.permission.code)),
    ),
  );

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      address: user.address,
      role: user.role,
      roleCodes,
      permissionCodes,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return response;
}
