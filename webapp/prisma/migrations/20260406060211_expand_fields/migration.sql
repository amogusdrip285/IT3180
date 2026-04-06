/*
  Warnings:

  - Added the required column `floorNo` to the `Household` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPhone` to the `Household` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectorName` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `note` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiptNo` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idNo` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Household" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartmentNo" TEXT NOT NULL,
    "floorNo" INTEGER NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "areaM2" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE'
);
INSERT INTO "new_Household" ("apartmentNo", "areaM2", "id", "ownerName", "status") SELECT "apartmentNo", "areaM2", "id", "ownerName", "status" FROM "Household";
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
    "receiptNo" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "Payment_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("feeTypeId", "id", "method", "obligationId", "paidAmount", "paidAt") SELECT "feeTypeId", "id", "method", "obligationId", "paidAmount", "paidAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_receiptNo_key" ON "Payment"("receiptNo");
CREATE TABLE "new_Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "idNo" TEXT NOT NULL,
    "residentType" TEXT NOT NULL,
    CONSTRAINT "Resident_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("fullName", "householdId", "id", "residentType") SELECT "fullName", "householdId", "id", "residentType" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE UNIQUE INDEX "Resident_idNo_key" ON "Resident"("idNo");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("fullName", "id", "password", "role", "status", "username") SELECT "fullName", "id", "password", "role", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
