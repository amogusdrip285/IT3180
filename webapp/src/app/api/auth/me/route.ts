import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { apiError } from "@/lib/errors";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("AUTH_REQUIRED", "Authentication required", 401);
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      roleCodes: user.roleCodes,
      permissionCodes: user.permissionCodes,
      status: user.status,
    },
  });
}
