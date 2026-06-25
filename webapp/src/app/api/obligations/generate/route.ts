import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "WRITE");
  if (deny) return deny;

  const openPeriods = await db.feePeriod.findMany({
    where: { status: "OPEN" },
    include: { feeType: true },
  });
  const households = await db.household.findMany();

  const existingKeys = await db.obligation.findMany({
    where: { periodId: { in: openPeriods.map((p) => p.id) } },
    select: { periodId: true, householdId: true },
  });
  const existingSet = new Set(existingKeys.map((k) => `${k.periodId}-${k.householdId}`));

  const data: Array<{ periodId: number; householdId: number; amountDue: number; amountPaid: number }> = [];
  for (const p of openPeriods) {
    for (const h of households) {
      const key = `${p.id}-${h.id}`;
      if (existingSet.has(key)) continue;
      const due = p.feeType.calcMethod === "PER_M2" ? h.areaM2 * p.feeType.rate : p.feeType.rate;
      data.push({ periodId: p.id, householdId: h.id, amountDue: due, amountPaid: 0 });
    }
  }

  if (data.length === 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  await db.obligation.createMany({ data });
  const created = data.length;

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "OBLIGATION_GENERATE",
    entityId: "BATCH",
    detail: `Generated ${created} obligations`,
  });

  return NextResponse.json({ ok: true, created });
}
