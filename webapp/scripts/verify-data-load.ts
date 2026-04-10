import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  try {
    const counts = {
      users: await db.user.count(),
      households: await db.household.count(),
      residents: await db.resident.count(),
      feeTypes: await db.feeType.count(),
      periods: await db.feePeriod.count(),
      obligations: await db.obligation.count(),
      payments: await db.payment.count(),
      events: await db.residencyEvent.count(),
      communications: await db.communicationLog.count(),
    };

    const checks = {
      hasCoreData: counts.households > 0 && counts.feeTypes > 0 && counts.periods > 0,
      hasTransactions: counts.obligations > 0 && counts.payments > 0,
      hasPeople: counts.users > 0 && counts.residents > 0,
      hasOpsLogs: counts.events > 0 && counts.communications > 0,
    };

    console.log(JSON.stringify({ counts, checks }, null, 2));

    if (!Object.values(checks).every(Boolean)) {
      process.exit(2);
    }
  } finally {
    await db.$disconnect();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
