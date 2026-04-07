import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  address: string;
  role: "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER";
  roleCodes: string[];
  permissionCodes: string[];
  status: "ACTIVE" | "BLOCKED";
};

const SESSION_COOKIE = "bm_session";

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date();
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
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
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt <= now) return null;
  if (session.user.status !== "ACTIVE") return null;

  const roleCodes = session.user.userRoles.map((x) => x.role.code);
  const permissionCodes = Array.from(
    new Set(
      session.user.userRoles.flatMap((x) => x.role.permissions.map((rp) => rp.permission.code)),
    ),
  );

  return {
    id: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    avatarUrl: session.user.avatarUrl,
    address: session.user.address,
    role: session.user.role,
    roleCodes,
    permissionCodes,
    status: session.user.status,
  };
}

export async function requireAuth(): Promise<{ user: AuthUser | null; error?: NextResponse }> {
  const user = await getAuthUser();
  if (!user) {
    return {
      user: null,
      error: apiError("AUTH_REQUIRED", "Authentication required", 401),
    };
  }
  return { user };
}

export function requireRole(user: AuthUser, allowed: Array<"ADMIN" | "ACCOUNTANT" | "TEAM_LEADER">): NextResponse | null {
  if (!allowed.includes(user.role)) {
    return apiError("PERMISSION_DENIED", "Permission denied", 403);
  }
  return null;
}

export function requirePermission(user: AuthUser, module: "SYSTEM" | "FEE" | "RESIDENT" | "REPORT", action: "READ" | "WRITE" | "ADMIN"): NextResponse | null {
  if (user.roleCodes.includes("ADMIN")) return null;
  const direct = `${module}_${action}`;
  const broad = `${module}_ADMIN`;
  const hasPermission = user.permissionCodes.includes(direct) || user.permissionCodes.includes(broad);
  if (!hasPermission) {
    return apiError("PERMISSION_DENIED", "Permission denied", 403);
  }
  return null;
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}
