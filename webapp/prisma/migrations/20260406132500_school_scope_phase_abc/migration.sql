-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "CommunicationLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_FeeType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "calcMethod" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "lateFeeRule" TEXT NOT NULL DEFAULT '',
    "effectiveFrom" DATETIME,
    "effectiveTo" DATETIME,
    "policyNote" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_FeeType" ("active", "calcMethod", "category", "code", "id", "name", "rate")
SELECT "active", "calcMethod", "category", "code", "id", "name", "rate" FROM "FeeType";
DROP TABLE "FeeType";
ALTER TABLE "new_FeeType" RENAME TO "FeeType";
CREATE UNIQUE INDEX "FeeType_code_key" ON "FeeType"("code");

CREATE TABLE "new_Household" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartmentNo" TEXT NOT NULL,
    "floorNo" INTEGER NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "parkingSlots" INTEGER NOT NULL DEFAULT 0,
    "moveInDate" DATETIME,
    "ownershipStatus" TEXT NOT NULL DEFAULT 'OWNER',
    "contractEndDate" DATETIME,
    "areaM2" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Household" ("apartmentNo", "areaM2", "createdAt", "floorNo", "id", "ownerName", "ownerPhone", "status")
SELECT "apartmentNo", "areaM2", "createdAt", "floorNo", "id", "ownerName", "ownerPhone", "status" FROM "Household";
DROP TABLE "Household";
ALTER TABLE "new_Household" RENAME TO "Household";
CREATE UNIQUE INDEX "Household_apartmentNo_key" ON "Household"("apartmentNo");

CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "obligationId" INTEGER NOT NULL,
    "feeTypeId" INTEGER NOT NULL,
    "paidAmount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectorName" TEXT NOT NULL,
    "payerName" TEXT NOT NULL DEFAULT '',
    "payerPhone" TEXT NOT NULL DEFAULT '',
    "bankTxRef" TEXT NOT NULL DEFAULT '',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "reversalNote" TEXT NOT NULL DEFAULT '',
    "receiptNo" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "Payment_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("collectorName", "feeTypeId", "id", "method", "note", "obligationId", "paidAmount", "paidAt", "receiptNo")
SELECT "collectorName", "feeTypeId", "id", "method", "note", "obligationId", "paidAmount", "paidAt", "receiptNo" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_receiptNo_key" ON "Payment"("receiptNo");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
