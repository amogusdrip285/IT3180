-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "FeePeriod_feeTypeId_idx" ON "FeePeriod"("feeTypeId");

-- CreateIndex
CREATE INDEX "FeePeriod_status_idx" ON "FeePeriod"("status");

-- CreateIndex
CREATE INDEX "FeePeriod_year_month_idx" ON "FeePeriod"("year", "month");

-- CreateIndex
CREATE INDEX "Obligation_householdId_idx" ON "Obligation"("householdId");

-- CreateIndex
CREATE INDEX "Obligation_periodId_idx" ON "Obligation"("periodId");

-- CreateIndex
CREATE INDEX "Payment_obligationId_idx" ON "Payment"("obligationId");

-- CreateIndex
CREATE INDEX "Payment_feeTypeId_idx" ON "Payment"("feeTypeId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- CreateIndex
CREATE INDEX "Resident_householdId_idx" ON "Resident"("householdId");
