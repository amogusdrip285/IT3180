import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { apiError } from "@/lib/errors";
import { isEmail, isPhone, isStrongPassword } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    username: string;
    email: string;
    phone: string;
    fullName: string;
    password: string;
    avatarUrl?: string;
    address?: string;
  };

  if (!body.username || !body.email || !body.phone || !body.fullName || !body.password) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }
  if (!isEmail(body.email)) return apiError("VALIDATION_ERROR", "Invalid email format", 400, { field: "email" });
  if (!isPhone(body.phone)) return apiError("VALIDATION_ERROR", "Invalid phone format", 400, { field: "phone" });
  if (!isStrongPassword(body.password)) return apiError("VALIDATION_ERROR", "Password is too weak", 400, { field: "password" });

  const userCount = await db.user.count();
  const allowBootstrap = (process.env.ALLOW_BOOTSTRAP_SIGNUP ?? "true") === "true";
  if (!allowBootstrap && userCount > 0) {
    return apiError("PERMISSION_DENIED", "Signup is disabled after initial setup. Admin creates accounts in Users tab.", 403);
  }

  const existing = await db.user.findFirst({ where: { OR: [{ username: body.username }, { email: body.email }] } });
  if (existing) return apiError("VALIDATION_ERROR", "Username or email already exists", 409);

  const user = await db.user.create({
    data: {
      username: body.username,
      email: body.email,
      phone: body.phone,
      fullName: body.fullName,
      avatarUrl: body.avatarUrl ?? "",
      address: body.address ?? "",
      role: "ADMIN",
      passwordHash: hashPassword(body.password),
      status: "ACTIVE",
    },
  });

  let adminRole = await db.appRole.findUnique({ where: { code: "ADMIN" } });
  if (!adminRole) {
    adminRole = await db.appRole.create({ data: { code: "ADMIN", name: "Administrator", description: "System administrator" } });
  }
  await db.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

  return NextResponse.json({ ok: true, userId: user.id });
}
