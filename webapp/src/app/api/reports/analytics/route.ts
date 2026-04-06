import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";

type AgingBucket = { label: string; count: number; amount: number };

function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "REPORT", "READ");
  if (deny) return deny;

  const [obligations, payments, feeTypes, households] = await Promise.all([
    db.obligation.findMany({ include: { period: true, household: true } }),
    db.payment.findMany({ include: { feeType: true, obligation: { include: { household: true, period: true } } } }),
    db.feeType.findMany(),
    db.household.findMany(),
  ]);

  const now = new Date();
  const aging: AgingBucket[] = [
    { label: "0-30", count: 0, amount: 0 },
    { label: "31-60", count: 0, amount: 0 },
    { label: "61-90", count: 0, amount: 0 },
    { label: "90+", count: 0, amount: 0 },
  ];

  for (const o of obligations) {
    const remaining = Math.max(0, o.amountDue - o.amountPaid);
    if (remaining <= 0) continue;
    const dueDate = new Date(o.period.year, o.period.month, 0);
    const days = Math.max(0, diffDays(dueDate, now));
    let idx = 3;
    if (days <= 30) idx = 0;
    else if (days <= 60) idx = 1;
    else if (days <= 90) idx = 2;
    aging[idx].count += 1;
    aging[idx].amount += remaining;
  }

  const collectionByMonthMap = new Map<string, { due: number; paid: number }>();
  for (const o of obligations) {
    const key = `${o.period.year}-${String(o.period.month).padStart(2, "0")}`;
    const current = collectionByMonthMap.get(key) ?? { due: 0, paid: 0 };
    current.due += o.amountDue;
    current.paid += o.amountPaid;
    collectionByMonthMap.set(key, current);
  }

  const collectionByMonth = Array.from(collectionByMonthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({
      label,
      due: v.due,
      paid: v.paid,
      rate: v.due > 0 ? Number(((v.paid / v.due) * 100).toFixed(1)) : 0,
    }));

  const byCollectorMap = new Map<string, number>();
  for (const p of payments) {
    byCollectorMap.set(p.collectorName, (byCollectorMap.get(p.collectorName) ?? 0) + p.paidAmount);
  }
  const byCollector = Array.from(byCollectorMap.entries())
    .map(([collector, amount]) => ({ collector, amount }))
    .sort((a, b) => b.amount - a.amount);

  const byFloorMap = new Map<number, { due: number; paid: number }>();
  for (const o of obligations) {
    const floor = o.household.floorNo;
    const current = byFloorMap.get(floor) ?? { due: 0, paid: 0 };
    current.due += o.amountDue;
    current.paid += o.amountPaid;
    byFloorMap.set(floor, current);
  }
  const byFloor = Array.from(byFloorMap.entries())
    .map(([floor, v]) => ({ floor, due: v.due, paid: v.paid, rate: v.due > 0 ? Number(((v.paid / v.due) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => a.floor - b.floor);

  const voluntaryFees = feeTypes.filter((f) => f.category === "VOLUNTARY").map((f) => f.id);
  const voluntaryPayments = payments.filter((p) => voluntaryFees.includes(p.feeTypeId));
  const payingHouseholds = new Set(voluntaryPayments.map((p) => p.obligation.householdId));
  const voluntaryTotal = voluntaryPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const voluntaryStats = {
    participatingHouseholds: payingHouseholds.size,
    totalHouseholds: households.length,
    participationRate: households.length > 0 ? Number(((payingHouseholds.size / households.length) * 100).toFixed(1)) : 0,
    totalAmount: voluntaryTotal,
    averageContribution: payingHouseholds.size > 0 ? Math.round(voluntaryTotal / payingHouseholds.size) : 0,
  };

  return NextResponse.json({
    aging,
    collectionByMonth,
    byCollector,
    byFloor,
    voluntaryStats,
  });
}
