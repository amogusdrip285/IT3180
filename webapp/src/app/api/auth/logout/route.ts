import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getAuthUser, sessionCookieName } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  const user = await getAuthUser();
  const cookie = sessionCookieName();
  const token = (await cookies()).get(cookie)?.value;

  const response = NextResponse.json({ ok: true });

  if (token) {
    await db.session.updateMany({ where: { token, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  if (user) {
    await writeAudit({
      actorUserId: user.id,
      action: "LOGOUT",
      entity: "USER",
      entityId: String(user.id),
      detail: `User ${user.username} logged out`,
    });
  }

  response.cookies.delete(cookie);
  return response;
}
