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

  let created = 0;
  for (const p of openPeriods) {
    for (const h of households) {
      const existing = await db.obligation.findUnique({
        where: { periodId_householdId: { periodId: p.id, householdId: h.id } },
      });
      if (existing) continue;
      const due = p.feeType.calcMethod === "PER_M2" ? h.areaM2 * p.feeType.rate : p.feeType.rate;
      await db.obligation.create({
        data: { periodId: p.id, householdId: h.id, amountDue: due, amountPaid: 0 },
      });
      created += 1;
    }
  }

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "OBLIGATION_GENERATE",
    entityId: "BATCH",
    detail: `Generated ${created} obligations`,
  });

  return NextResponse.json({ ok: true, created });
}
