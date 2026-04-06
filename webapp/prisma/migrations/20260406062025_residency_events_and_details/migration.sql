-- CreateTable
CREATE TABLE "ResidencyEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromDate" DATETIME NOT NULL,
    "toDate" DATETIME,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "ResidencyEvent_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
