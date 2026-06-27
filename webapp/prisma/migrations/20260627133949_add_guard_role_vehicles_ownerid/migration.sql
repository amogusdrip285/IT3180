-- AlterTable
ALTER TABLE "Resident" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "brand" TEXT,
    "color" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "VehicleLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Household" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apartmentNo" TEXT NOT NULL,
    "floorNo" INTEGER NOT NULL,
    "ownerName" TEXT NOT NULL DEFAULT '',
    "ownerPhone" TEXT NOT NULL DEFAULT '',
    "ownerId" INTEGER,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "parkingSlots" INTEGER NOT NULL DEFAULT 0,
    "moveInDate" DATETIME,
    "ownershipStatus" TEXT NOT NULL DEFAULT 'OWNER',
    "contractEndDate" DATETIME,
    "areaM2" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Household" ("apartmentNo", "areaM2", "contractEndDate", "createdAt", "emergencyContactName", "emergencyContactPhone", "floorNo", "id", "moveInDate", "ownerName", "ownerPhone", "ownershipStatus", "parkingSlots", "status") SELECT "apartmentNo", "areaM2", "contractEndDate", "createdAt", "emergencyContactName", "emergencyContactPhone", "floorNo", "id", "moveInDate", "ownerName", "ownerPhone", "ownershipStatus", "parkingSlots", "status" FROM "Household";
DROP TABLE "Household";
ALTER TABLE "new_Household" RENAME TO "Household";
CREATE UNIQUE INDEX "Household_apartmentNo_key" ON "Household"("apartmentNo");
CREATE UNIQUE INDEX "Household_ownerId_key" ON "Household"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Vehicle_householdId_idx" ON "Vehicle"("householdId");

-- CreateIndex
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "VehicleLog_vehicleId_idx" ON "VehicleLog"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleLog_timestamp_idx" ON "VehicleLog"("timestamp");
