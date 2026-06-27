import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { id } = await ctx.params;
  await db.vehicleLog.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
