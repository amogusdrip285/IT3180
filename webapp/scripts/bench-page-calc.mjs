import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function now() {
  return Number(process.hrtime.bigint()) / 1e6;
}

async function main() {
  const [households, residents, feeTypes, periods, obligations, payments] = await Promise.all([
    db.household.findMany(),
    db.resident.findMany(),
    db.feeType.findMany(),
    db.feePeriod.findMany(),
    db.obligation.findMany(),
    db.payment.findMany(),
  ]);

  const t0 = now();
  const obligationById = new Map(obligations.map((o) => [o.id, o]));
  const periodById = new Map(periods.map((p) => [p.id, p]));
  const feeTypeById = new Map(feeTypes.map((f) => [f.id, f]));
  const householdById = new Map(households.map((h) => [h.id, h]));
  const tMaps = now() - t0;

  const t1 = now();
  const paymentFacts = payments
    .map((p) => {
      const o = obligationById.get(p.obligationId);
      if (!o) return null;
      const period = periodById.get(o.periodId);
      const fee = feeTypeById.get(p.feeTypeId);
      const household = householdById.get(o.householdId);
      if (!period || !fee || !household) return null;
      return {
        paidAtTs: new Date(p.paidAt).getTime(),
        feeCategory: fee.category,
        feeTypeId: p.feeTypeId,
        householdId: o.householdId,
        method: p.method,
        collectorName: p.collectorName,
        payerName: p.payerName ?? "",
        month: period.month,
        year: period.year,
      };
    })
    .filter(Boolean);
  const tFacts = now() - t1;

  const t2 = now();
  const filtered = paymentFacts.filter((x) => {
    if (!x) return false;
    if (x.year !== 2026) return false;
    if (x.month < 1 || x.month > 12) return false;
    if (x.method !== "BANK") return false;
    return true;
  });
  const tFilter = now() - t2;

  const t3 = now();
  let paid = 0;
  for (const o of obligations) paid += o.amountPaid;
  const tAgg = now() - t3;

  console.log(
    JSON.stringify(
      {
        dataset: {
          households: households.length,
          residents: residents.length,
          feeTypes: feeTypes.length,
          periods: periods.length,
          obligations: obligations.length,
          payments: payments.length,
        },
        ms: {
          buildMaps: Number(tMaps.toFixed(3)),
          buildPaymentFacts: Number(tFacts.toFixed(3)),
          filterPayments: Number(tFilter.toFixed(3)),
          aggregatePaid: Number(tAgg.toFixed(3)),
        },
        filteredCount: filtered.length,
        totalPaid: Math.round(paid),
      },
      null,
      2,
    ),
  );
}

main()
  .finally(async () => {
    await db.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
