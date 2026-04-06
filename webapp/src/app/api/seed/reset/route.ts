import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function makeReceiptNo(year: number, month: number, idx: number): string {
  return `PT-${year}${String(month).padStart(2, "0")}-${String(idx).padStart(5, "0")}`;
}

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "SYSTEM", "ADMIN");
  if (deny) return deny;

  await db.auditLog.deleteMany();
  await db.session.deleteMany();
  await db.rolePermission.deleteMany();
  await db.userRole.deleteMany();
  await db.permission.deleteMany();
  await db.appRole.deleteMany();
  await db.payment.deleteMany();
  await db.obligation.deleteMany();
  await db.residencyEvent.deleteMany();
  await db.resident.deleteMany();
  await db.feePeriod.deleteMany();
  await db.feeType.deleteMany();
  await db.communicationLog.deleteMany();
  await db.household.deleteMany();
  await db.user.deleteMany();

  const users = await Promise.all([
    db.user.create({ data: { username: "admin", email: "admin@bluemoon.vn", phone: "0912.000.001", fullName: "Trưởng Ban Quản Trị", role: "ADMIN", passwordHash: hashPassword("admin"), status: "ACTIVE" } }),
    db.user.create({ data: { username: "accountant", email: "ketoan@bluemoon.vn", phone: "0912.000.002", fullName: "Nguyễn Thu Hà", role: "ACCOUNTANT", passwordHash: hashPassword("accountant"), status: "ACTIVE" } }),
    db.user.create({ data: { username: "leader", email: "totruong@bluemoon.vn", phone: "0912.000.003", fullName: "Lê Văn Dũng", role: "TEAM_LEADER", passwordHash: hashPassword("leader"), status: "ACTIVE" } }),
  ]);

  const [adminRole, accountantRole, leaderRole] = await Promise.all([
    db.appRole.create({ data: { code: "ADMIN", name: "Administrator", description: "System administrator" } }),
    db.appRole.create({ data: { code: "ACCOUNTANT", name: "Accountant", description: "Fee collection operations" } }),
    db.appRole.create({ data: { code: "TEAM_LEADER", name: "Team leader", description: "Resident operations" } }),
  ]);

  const permissionDefs = [
    { code: "SYSTEM_READ", name: "System read", module: "SYSTEM" },
    { code: "SYSTEM_WRITE", name: "System write", module: "SYSTEM" },
    { code: "SYSTEM_ADMIN", name: "System admin", module: "SYSTEM" },
    { code: "FEE_READ", name: "Fee read", module: "FEE" },
    { code: "FEE_WRITE", name: "Fee write", module: "FEE" },
    { code: "FEE_ADMIN", name: "Fee admin", module: "FEE" },
    { code: "RESIDENT_READ", name: "Resident read", module: "RESIDENT" },
    { code: "RESIDENT_WRITE", name: "Resident write", module: "RESIDENT" },
    { code: "RESIDENT_ADMIN", name: "Resident admin", module: "RESIDENT" },
    { code: "REPORT_READ", name: "Report read", module: "REPORT" },
    { code: "REPORT_WRITE", name: "Report write", module: "REPORT" },
    { code: "REPORT_ADMIN", name: "Report admin", module: "REPORT" },
  ] as const;

  const permissions = await Promise.all(
    permissionDefs.map((p) => db.permission.create({ data: { code: p.code, name: p.name, module: p.module, screen: p.module, description: p.name } })),
  );

  const permByCode = new Map(permissions.map((p) => [p.code, p.id] as const));

  await db.rolePermission.createMany({ data: permissionDefs.map((p) => ({ roleId: adminRole.id, permissionId: permByCode.get(p.code)! })) });
  await db.rolePermission.createMany({ data: ["FEE_READ", "FEE_WRITE", "RESIDENT_READ", "REPORT_READ"].map((code) => ({ roleId: accountantRole.id, permissionId: permByCode.get(code)! })) });
  await db.rolePermission.createMany({ data: ["FEE_READ", "RESIDENT_READ", "RESIDENT_WRITE", "REPORT_READ"].map((code) => ({ roleId: leaderRole.id, permissionId: permByCode.get(code)! })) });

  await db.userRole.createMany({
    data: [
      { userId: users[0].id, roleId: adminRole.id },
      { userId: users[1].id, roleId: accountantRole.id },
      { userId: users[2].id, roleId: leaderRole.id },
    ],
  });

  const households = await Promise.all([
    db.household.create({ data: { apartmentNo: "A-1203", floorNo: 12, ownerName: "Nguyễn Văn An", ownerPhone: "0903.111.203", emergencyContactName: "Nguyễn Thị Mai", emergencyContactPhone: "0909.100.203", parkingSlots: 1, moveInDate: new Date("2022-05-01"), ownershipStatus: "OWNER", areaM2: 68, status: "ACTIVE" } }),
    db.household.create({ data: { apartmentNo: "B-1805", floorNo: 18, ownerName: "Trần Thị Hoa", ownerPhone: "0903.222.805", emergencyContactName: "Trần Văn Huy", emergencyContactPhone: "0909.200.805", parkingSlots: 2, moveInDate: new Date("2021-10-12"), ownershipStatus: "OWNER", areaM2: 82, status: "ACTIVE" } }),
    db.household.create({ data: { apartmentNo: "C-2201", floorNo: 22, ownerName: "Lê Minh Đức", ownerPhone: "0903.333.201", emergencyContactName: "Lê Thu Hà", emergencyContactPhone: "0909.300.201", parkingSlots: 1, moveInDate: new Date("2023-01-20"), ownershipStatus: "TENANT", contractEndDate: new Date("2027-01-20"), areaM2: 95, status: "ACTIVE" } }),
    db.household.create({ data: { apartmentNo: "A-0906", floorNo: 9, ownerName: "Phạm Hồng Hải", ownerPhone: "0903.444.906", emergencyContactName: "Phạm Huyền", emergencyContactPhone: "0909.400.906", parkingSlots: 0, moveInDate: new Date("2024-03-10"), ownershipStatus: "TENANT", contractEndDate: new Date("2026-12-31"), areaM2: 60, status: "ACTIVE" } }),
    db.household.create({ data: { apartmentNo: "B-1102", floorNo: 11, ownerName: "Đào Thị Lan", ownerPhone: "0903.555.102", emergencyContactName: "Đào Quang", emergencyContactPhone: "0909.500.102", parkingSlots: 1, moveInDate: new Date("2020-09-09"), ownershipStatus: "OWNER", areaM2: 74, status: "ACTIVE" } }),
    db.household.create({ data: { apartmentNo: "C-1508", floorNo: 15, ownerName: "Vũ Quốc Bình", ownerPhone: "0903.666.508", emergencyContactName: "Vũ Ngọc Anh", emergencyContactPhone: "0909.600.508", parkingSlots: 2, moveInDate: new Date("2022-11-18"), ownershipStatus: "OWNER", areaM2: 88, status: "ACTIVE" } }),
  ]);

  await db.communicationLog.createMany({
    data: [
      { householdId: households[0].id, channel: "SMS", status: "SENT", sentAt: new Date("2026-03-03"), note: "Nhac dong phi thang 3" },
      { householdId: households[2].id, channel: "EMAIL", status: "SENT", sentAt: new Date("2026-03-04"), note: "Thong bao no qua han" },
      { householdId: households[3].id, channel: "ZALO", status: "FAILED", sentAt: new Date("2026-03-05"), note: "Khong ket noi duoc" },
    ],
  });

  const residents = await Promise.all([
    db.resident.create({ data: { householdId: households[0].id, fullName: "Nguyễn Văn An", dob: new Date("1987-02-03"), gender: "MALE", idNo: "012345678901", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[0].id, fullName: "Nguyễn Thị Mai", dob: new Date("1990-06-11"), gender: "FEMALE", idNo: "012345678902", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[1].id, fullName: "Trần Thị Hoa", dob: new Date("1984-03-20"), gender: "FEMALE", idNo: "012345678903", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[2].id, fullName: "Lê Minh Đức", dob: new Date("1982-12-09"), gender: "MALE", idNo: "012345678904", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[3].id, fullName: "Phạm Hồng Hải", dob: new Date("1993-01-15"), gender: "MALE", idNo: "012345678905", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[4].id, fullName: "Đào Thị Lan", dob: new Date("1991-09-29"), gender: "FEMALE", idNo: "012345678906", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Quốc Bình", dob: new Date("1988-07-05"), gender: "MALE", idNo: "012345678907", residentType: "PERMANENT" } }),
    db.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Ngọc Anh", dob: new Date("2001-11-18"), gender: "FEMALE", idNo: "012345678908", residentType: "TEMPORARY" } }),
  ]);

  await db.residencyEvent.createMany({
    data: [
      { residentId: residents[7].id, eventType: "TEMP_RESIDENCE", fromDate: new Date("2026-03-01"), toDate: new Date("2026-08-30"), note: "Đăng ký tạm trú 6 tháng", createdBy: "Lê Văn Dũng" },
      { residentId: residents[3].id, eventType: "TEMP_ABSENCE", fromDate: new Date("2026-02-10"), toDate: new Date("2026-02-20"), note: "Đi công tác", createdBy: "Lê Văn Dũng" },
    ],
  });

  const service = await db.feeType.create({ data: { code: "SERVICE_FEE", name: "Phí dịch vụ", category: "MANDATORY", calcMethod: "PER_M2", rate: 7000, graceDays: 5, lateFeeRule: "0.05%/day", effectiveFrom: new Date("2025-01-01"), policyNote: "Ap dung toan khu", active: true } });
  const management = await db.feeType.create({ data: { code: "MANAGEMENT_FEE", name: "Phí quản lý", category: "MANDATORY", calcMethod: "PER_M2", rate: 2500, graceDays: 7, lateFeeRule: "0.03%/day", effectiveFrom: new Date("2025-01-01"), policyNote: "Theo quy che quan ly", active: true } });
  const charity = await db.feeType.create({ data: { code: "CHARITY", name: "Quỹ từ thiện", category: "VOLUNTARY", calcMethod: "FIXED", rate: 120000, policyNote: "Dong gop tu nguyen", active: true } });
  const seaIsland = await db.feeType.create({ data: { code: "SEA_ISLAND", name: "Quỹ biển đảo", category: "VOLUNTARY", calcMethod: "FIXED", rate: 80000, policyNote: "Van dong theo dot", active: true } });

  const feeTypeById = new Map<number, { calcMethod: "PER_M2" | "FIXED"; rate: number }>([
    [service.id, { calcMethod: "PER_M2", rate: service.rate }],
    [management.id, { calcMethod: "PER_M2", rate: management.rate }],
    [charity.id, { calcMethod: "FIXED", rate: charity.rate }],
    [seaIsland.id, { calcMethod: "FIXED", rate: seaIsland.rate }],
  ]);

  const periods: Array<{ id: number; feeTypeId: number; month: number; year: number; status: "OPEN" | "CLOSED" }> = [];
  for (const year of [2025, 2026]) {
    const monthStart = year === 2025 ? 9 : 1;
    const monthEnd = year === 2025 ? 12 : 12;
    for (let month = monthStart; month <= monthEnd; month += 1) {
      periods.push({ id: (await db.feePeriod.create({ data: { feeTypeId: service.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id, feeTypeId: service.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
      periods.push({ id: (await db.feePeriod.create({ data: { feeTypeId: management.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id, feeTypeId: management.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
      if (month % 3 === 0) {
        periods.push({ id: (await db.feePeriod.create({ data: { feeTypeId: charity.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id, feeTypeId: charity.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
      }
      if (month === 5 || month === 11) {
        periods.push({ id: (await db.feePeriod.create({ data: { feeTypeId: seaIsland.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id, feeTypeId: seaIsland.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
      }
    }
  }

  let receiptIdx = 1;
  for (const p of periods) {
    const feeType = feeTypeById.get(p.feeTypeId)!;
    for (const h of households) {
      const due = feeType.calcMethod === "PER_M2" ? h.areaM2 * feeType.rate : feeType.rate;
      const paidRatio = ((h.id + p.month + p.year) % 4) / 4;
      const amountPaid = p.status === "OPEN" ? Math.round(due * Math.min(paidRatio, 0.35)) : Math.round(due * paidRatio);
      const obligation = await db.obligation.create({ data: { periodId: p.id, householdId: h.id, amountDue: due, amountPaid } });

      if (amountPaid > 0) {
        const chunks = amountPaid > 120000 ? [Math.round(amountPaid * 0.6), amountPaid - Math.round(amountPaid * 0.6)] : [amountPaid];
        for (let idx = 0; idx < chunks.length; idx += 1) {
          const date = new Date(p.year, p.month - 1, Math.min(25, 5 + idx * 10));
          const collector = idx % 2 === 0 ? "Nguyễn Thu Hà" : "Lê Văn Dũng";
          await db.payment.create({
            data: {
              obligationId: obligation.id,
              feeTypeId: p.feeTypeId,
              paidAmount: chunks[idx],
              method: (idx + obligation.id) % 2 === 0 ? "BANK" : "CASH",
              paidAt: date,
              collectorName: collector,
              payerName: h.ownerName,
              payerPhone: h.ownerPhone,
              bankTxRef: (idx + obligation.id) % 2 === 0 ? `TX-${p.year}${String(p.month).padStart(2, "0")}-${obligation.id}-${idx}` : "",
              attachmentUrl: "",
              reversalNote: "",
              receiptNo: makeReceiptNo(p.year, p.month, receiptIdx++),
              note: "Thu theo đợt định kỳ",
            },
          });
        }
      }
    }
  }

  await db.auditLog.create({
    data: {
      actorUserId: auth.user!.id,
      action: "UPDATE",
      entity: "SYSTEM",
      entityId: "SEED",
      detail: "Reset and seeded database",
    },
  });

  return NextResponse.json({ ok: true });
}
