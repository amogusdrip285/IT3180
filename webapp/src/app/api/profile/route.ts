import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { isEmail, isPhone } from "@/lib/validation";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const user = await db.user.findUnique({
    where: { id: auth.user!.id },
    select: { id: true, username: true, email: true, phone: true, fullName: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = (await req.json()) as { fullName?: string; email?: string; phone?: string };
  if (body.email && !isEmail(body.email)) return apiError("VALIDATION_ERROR", "Invalid email format", 400, { field: "email" });
  if (body.phone && !isPhone(body.phone)) return apiError("VALIDATION_ERROR", "Invalid phone format", 400, { field: "phone" });

  const user = await db.user.update({
    where: { id: auth.user!.id },
    data: { fullName: body.fullName, email: body.email, phone: body.phone },
    select: { id: true, username: true, email: true, phone: true, fullName: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
