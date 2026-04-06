import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { apiError } from "@/lib/errors";
import { isEmail, isPhone, isStrongPassword, parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const { skip, take } = parsePagination(req.nextUrl.searchParams);

  const rows = await db.user.findMany({
    orderBy: { id: "asc" },
    skip,
    take,
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
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  const body = (await req.json()) as {
    username: string;
    email: string;
    phone: string;
    fullName: string;
    role: "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER";
    password: string;
  };
  if (!body.username || !body.email || !body.phone || !body.fullName || !body.role || !body.password) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }
  if (!isEmail(body.email)) {
    return apiError("VALIDATION_ERROR", "Invalid email format", 400, { field: "email" });
  }
  if (!isPhone(body.phone)) {
    return apiError("VALIDATION_ERROR", "Invalid phone format", 400, { field: "phone" });
  }
  if (!isStrongPassword(body.password)) {
    return apiError("VALIDATION_ERROR", "Password is too weak", 400, { field: "password" });
  }

  const existing = await db.user.findFirst({ where: { OR: [{ username: body.username }, { email: body.email }] } });
  if (existing) return apiError("VALIDATION_ERROR", "Username or email already exists", 409);

  const user = await db.user.create({
    data: {
      username: body.username,
      email: body.email,
      phone: body.phone,
      fullName: body.fullName,
      role: body.role,
      passwordHash: hashPassword(body.password),
      status: "ACTIVE",
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

  const defaultRole = await db.appRole.findUnique({ where: { code: body.role } });
  if (defaultRole) {
    await db.userRole.create({ data: { userId: user.id, roleId: defaultRole.id } });
  }

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "USER",
    entityId: String(user.id),
    detail: `Created user ${user.username}`,
  });

  return NextResponse.json(user);
}
