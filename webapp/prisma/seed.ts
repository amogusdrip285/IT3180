import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function makeReceiptNo(year: number, month: number, idx: number): string {
  return `PT-${year}${String(month).padStart(2, "0")}-${String(idx).padStart(5, "0")}`;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.appRole.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.obligation.deleteMany();
  await prisma.residencyEvent.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.feePeriod.deleteMany();
  await prisma.feeType.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        email: "admin@bluemoon.vn",
        phone: "0912.000.001",
        fullName: "Trưởng Ban Quản Trị",
        role: "ADMIN",
        passwordHash: hashPassword("admin"),
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        username: "accountant",
        email: "ketoan@bluemoon.vn",
        phone: "0912.000.002",
        fullName: "Nguyễn Thu Hà",
        role: "ACCOUNTANT",
        passwordHash: hashPassword("accountant"),
        status: "ACTIVE",
      },
    }),
    prisma.user.create({
      data: {
        username: "leader",
        email: "totruong@bluemoon.vn",
        phone: "0912.000.003",
        fullName: "Lê Văn Dũng",
        role: "TEAM_LEADER",
        passwordHash: hashPassword("leader"),
        status: "ACTIVE",
      },
    }),
    prisma.user.create({ data: { username: "acct_01", email: "acct01@bluemoon.vn", phone: "0912.000.011", fullName: "Hoàng Ngọc Linh", role: "ACCOUNTANT", passwordHash: hashPassword("accountant"), status: "ACTIVE" } }),
    prisma.user.create({ data: { username: "acct_02", email: "acct02@bluemoon.vn", phone: "0912.000.012", fullName: "Vũ Thành Nam", role: "ACCOUNTANT", passwordHash: hashPassword("accountant"), status: "ACTIVE" } }),
    prisma.user.create({ data: { username: "leader_01", email: "leader01@bluemoon.vn", phone: "0912.000.013", fullName: "Phan Trúc Mai", role: "TEAM_LEADER", passwordHash: hashPassword("leader"), status: "ACTIVE" } }),
    prisma.user.create({ data: { username: "leader_02", email: "leader02@bluemoon.vn", phone: "0912.000.014", fullName: "Lưu Quốc Thắng", role: "TEAM_LEADER", passwordHash: hashPassword("leader"), status: "ACTIVE" } }),
    prisma.user.create({ data: { username: "support_01", email: "support01@bluemoon.vn", phone: "0912.000.015", fullName: "Đặng Thu Hiền", role: "TEAM_LEADER", passwordHash: hashPassword("leader"), status: "BLOCKED" } }),
  ]);

  const [adminRole, accountantRole, leaderRole] = await Promise.all([
    prisma.appRole.create({ data: { code: "ADMIN", name: "Administrator", description: "System administrator" } }),
    prisma.appRole.create({ data: { code: "ACCOUNTANT", name: "Accountant", description: "Fee collection operations" } }),
    prisma.appRole.create({ data: { code: "TEAM_LEADER", name: "Team leader", description: "Resident operations" } }),
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
    permissionDefs.map((p) =>
      prisma.permission.create({ data: { code: p.code, name: p.name, module: p.module, screen: p.module, description: p.name } }),
    ),
  );

  const permByCode = new Map(permissions.map((p) => [p.code, p.id] as const));

  const grant = async (roleId: number, codes: string[]) => {
    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({ roleId, permissionId: permByCode.get(code)! })),
    });
  };

  await grant(adminRole.id, permissionDefs.map((p) => p.code));
  await grant(accountantRole.id, ["FEE_READ", "FEE_WRITE", "RESIDENT_READ", "REPORT_READ"]);
  await grant(leaderRole.id, ["FEE_READ", "RESIDENT_READ", "RESIDENT_WRITE", "REPORT_READ"]);

  await prisma.userRole.createMany({
    data: [
      { userId: createdUsers[0].id, roleId: adminRole.id },
      { userId: createdUsers[1].id, roleId: accountantRole.id },
      { userId: createdUsers[2].id, roleId: leaderRole.id },
      { userId: createdUsers[3].id, roleId: accountantRole.id },
      { userId: createdUsers[4].id, roleId: accountantRole.id },
      { userId: createdUsers[5].id, roleId: leaderRole.id },
      { userId: createdUsers[6].id, roleId: leaderRole.id },
      { userId: createdUsers[7].id, roleId: leaderRole.id },
    ],
  });

  const baseHouseholds = await Promise.all([
    prisma.household.create({ data: { apartmentNo: "A-1203", floorNo: 12, ownerName: "Nguyễn Văn An", ownerPhone: "0903.111.203", emergencyContactName: "Nguyễn Thị Mai", emergencyContactPhone: "0909.100.203", parkingSlots: 1, moveInDate: new Date("2022-05-01"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 68, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "B-1805", floorNo: 18, ownerName: "Trần Thị Hoa", ownerPhone: "0903.222.805", emergencyContactName: "Trần Văn Huy", emergencyContactPhone: "0909.200.805", parkingSlots: 2, moveInDate: new Date("2021-10-12"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 82, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "C-2201", floorNo: 22, ownerName: "Lê Minh Đức", ownerPhone: "0903.333.201", emergencyContactName: "Lê Thu Hà", emergencyContactPhone: "0909.300.201", parkingSlots: 1, moveInDate: new Date("2023-01-20"), ownershipStatus: "TENANT", contractEndDate: new Date("2027-01-20"), areaM2: 95, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "A-0906", floorNo: 9, ownerName: "Phạm Hồng Hải", ownerPhone: "0903.444.906", emergencyContactName: "Phạm Huyền", emergencyContactPhone: "0909.400.906", parkingSlots: 0, moveInDate: new Date("2024-03-10"), ownershipStatus: "TENANT", contractEndDate: new Date("2026-12-31"), areaM2: 60, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "B-1102", floorNo: 11, ownerName: "Đào Thị Lan", ownerPhone: "0903.555.102", emergencyContactName: "Đào Quang", emergencyContactPhone: "0909.500.102", parkingSlots: 1, moveInDate: new Date("2020-09-09"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 74, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "C-1508", floorNo: 15, ownerName: "Vũ Quốc Bình", ownerPhone: "0903.666.508", emergencyContactName: "Vũ Ngọc Anh", emergencyContactPhone: "0909.600.508", parkingSlots: 2, moveInDate: new Date("2022-11-18"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 88, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "A-0702", floorNo: 7, ownerName: "Bùi Thanh Sơn", ownerPhone: "0903.777.702", emergencyContactName: "Bùi Thu Hà", emergencyContactPhone: "0909.700.702", parkingSlots: 1, moveInDate: new Date("2021-08-14"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 72, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "B-2004", floorNo: 20, ownerName: "Phan Đức Long", ownerPhone: "0903.888.204", emergencyContactName: "Phan Minh Châu", emergencyContactPhone: "0909.800.204", parkingSlots: 2, moveInDate: new Date("2023-04-22"), ownershipStatus: "TENANT", contractEndDate: new Date("2027-04-22"), areaM2: 91, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "C-1009", floorNo: 10, ownerName: "Ngô Hải Yến", ownerPhone: "0903.999.109", emergencyContactName: "Ngô Quang Vinh", emergencyContactPhone: "0909.900.109", parkingSlots: 1, moveInDate: new Date("2020-12-06"), ownershipStatus: "OWNER", contractEndDate: null, areaM2: 79, status: "ACTIVE" } }),
    prisma.household.create({ data: { apartmentNo: "D-0301", floorNo: 3, ownerName: "Trịnh Tuấn Khang", ownerPhone: "0903.101.301", emergencyContactName: "Trịnh Thu An", emergencyContactPhone: "0909.101.301", parkingSlots: 1, moveInDate: new Date("2024-01-05"), ownershipStatus: "TENANT", contractEndDate: new Date("2026-10-01"), areaM2: 64, status: "ACTIVE" } }),
  ]);

  const generatedHouseholds = await Promise.all(
    Array.from({ length: 20 }, (_, idx) => {
      const floorNo = 2 + (idx % 25);
      const apartmentNo = `${String.fromCharCode(68 + (idx % 3))}-${String(floorNo).padStart(2, "0")}${String((idx % 8) + 1).padStart(2, "0")}`;
      return prisma.household.create({
        data: {
          apartmentNo,
          floorNo,
          ownerName: `Hộ gia đình ${idx + 11}`,
          ownerPhone: `0908.${String(200000 + idx).padStart(6, "0")}`,
          emergencyContactName: `Người thân ${idx + 11}`,
          emergencyContactPhone: `0911.${String(300000 + idx).padStart(6, "0")}`,
          parkingSlots: (idx % 3) + 1,
          moveInDate: new Date(2019 + (idx % 7), idx % 12, (idx % 24) + 1),
          ownershipStatus: idx % 4 === 0 ? "TENANT" : "OWNER",
          contractEndDate: idx % 4 === 0 ? new Date(2027, idx % 12, 1) : null,
          areaM2: 58 + (idx % 9) * 6,
          status: "ACTIVE",
        },
      });
    }),
  );

  const households = [...baseHouseholds, ...generatedHouseholds];

  await prisma.communicationLog.createMany({
    data: households.flatMap((h, idx) => [
      { householdId: h.id, channel: idx % 2 === 0 ? "SMS" : "EMAIL", status: "SENT", sentAt: new Date(2026, 2, 3 + (idx % 10)), note: "Nhắc đóng phí định kỳ" },
      { householdId: h.id, channel: idx % 3 === 0 ? "ZALO" : "NOTICE", status: idx % 4 === 0 ? "FAILED" : "SENT", sentAt: new Date(2026, 3, 8 + (idx % 10)), note: idx % 4 === 0 ? "Không gửi được, cần gọi trực tiếp" : "Thông báo công nợ tháng mới" },
    ]),
  });

  const extraResidentSeeds = generatedHouseholds.flatMap((h, idx) => {
    const count = (idx % 4) + 1;
    return Array.from({ length: count }, (_, n) => ({
      householdId: h.id,
      fullName: `Thành viên ${idx + 11}-${n + 1}`,
      dob: new Date(1978 + ((idx + n) % 35), (idx + n) % 12, ((idx + n) % 26) + 1),
      gender: (n % 3 === 0 ? "MALE" : n % 3 === 1 ? "FEMALE" : "OTHER") as "MALE" | "FEMALE" | "OTHER",
      idNo: `099${String(100000000 + idx * 10 + n)}`,
      residentType: (n <= 1 ? "PERMANENT" : "TEMPORARY") as "PERMANENT" | "TEMPORARY",
    }));
  });

  const residents = await Promise.all([
    prisma.resident.create({ data: { householdId: households[0].id, fullName: "Nguyễn Văn An", dob: new Date("1987-02-03"), gender: "MALE", idNo: "012345678901", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[0].id, fullName: "Nguyễn Thị Mai", dob: new Date("1990-06-11"), gender: "FEMALE", idNo: "012345678902", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[1].id, fullName: "Trần Thị Hoa", dob: new Date("1984-03-20"), gender: "FEMALE", idNo: "012345678903", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[1].id, fullName: "Trần Văn Huy", dob: new Date("1982-08-14"), gender: "MALE", idNo: "012345678913", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[1].id, fullName: "Trần Gia Bảo", dob: new Date("2014-04-09"), gender: "MALE", idNo: "012345678914", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[2].id, fullName: "Lê Minh Đức", dob: new Date("1982-12-09"), gender: "MALE", idNo: "012345678904", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[2].id, fullName: "Lê Thu Hà", dob: new Date("1985-01-18"), gender: "FEMALE", idNo: "012345678915", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[2].id, fullName: "Lê Gia Khánh", dob: new Date("2011-10-22"), gender: "MALE", idNo: "012345678916", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[2].id, fullName: "Lê Bảo Ngọc", dob: new Date("2017-07-03"), gender: "FEMALE", idNo: "012345678917", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[3].id, fullName: "Phạm Hồng Hải", dob: new Date("1993-01-15"), gender: "MALE", idNo: "012345678905", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[3].id, fullName: "Phạm Huyền", dob: new Date("1996-02-01"), gender: "FEMALE", idNo: "012345678918", residentType: "TEMPORARY" } }),

    prisma.resident.create({ data: { householdId: households[4].id, fullName: "Đào Thị Lan", dob: new Date("1991-09-29"), gender: "FEMALE", idNo: "012345678906", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[4].id, fullName: "Đào Quang", dob: new Date("1989-11-30"), gender: "MALE", idNo: "012345678919", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[4].id, fullName: "Đào Mai Chi", dob: new Date("2016-09-12"), gender: "FEMALE", idNo: "012345678920", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Quốc Bình", dob: new Date("1988-07-05"), gender: "MALE", idNo: "012345678907", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Ngọc Anh", dob: new Date("2001-11-18"), gender: "FEMALE", idNo: "012345678908", residentType: "TEMPORARY" } }),
    prisma.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Hoàng Nam", dob: new Date("2010-05-17"), gender: "MALE", idNo: "012345678921", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[5].id, fullName: "Vũ Thảo Vy", dob: new Date("2019-06-21"), gender: "FEMALE", idNo: "012345678922", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[6].id, fullName: "Bùi Thanh Sơn", dob: new Date("1986-05-07"), gender: "MALE", idNo: "012345678909", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[6].id, fullName: "Bùi Thu Hà", dob: new Date("1988-04-26"), gender: "FEMALE", idNo: "012345678923", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[7].id, fullName: "Phan Đức Long", dob: new Date("1983-03-03"), gender: "MALE", idNo: "012345678910", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[7].id, fullName: "Phan Minh Châu", dob: new Date("1987-01-16"), gender: "FEMALE", idNo: "012345678924", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[7].id, fullName: "Phan Tuấn Kiệt", dob: new Date("2013-02-05"), gender: "MALE", idNo: "012345678925", residentType: "TEMPORARY" } }),

    prisma.resident.create({ data: { householdId: households[8].id, fullName: "Ngô Hải Yến", dob: new Date("1992-10-19"), gender: "FEMALE", idNo: "012345678911", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[8].id, fullName: "Ngô Quang Vinh", dob: new Date("1989-07-02"), gender: "MALE", idNo: "012345678926", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[8].id, fullName: "Ngô Minh Anh", dob: new Date("2012-03-27"), gender: "FEMALE", idNo: "012345678927", residentType: "PERMANENT" } }),
    prisma.resident.create({ data: { householdId: households[8].id, fullName: "Ngô Gia Huy", dob: new Date("2018-12-15"), gender: "MALE", idNo: "012345678928", residentType: "PERMANENT" } }),

    prisma.resident.create({ data: { householdId: households[9].id, fullName: "Trịnh Tuấn Khang", dob: new Date("1995-01-25"), gender: "MALE", idNo: "012345678912", residentType: "TEMPORARY" } }),
    ...extraResidentSeeds.map((r) => prisma.resident.create({ data: r })),
  ]);

  const tempResident = residents.find((r) => r.fullName === "Vũ Ngọc Anh") ?? residents[0];
  const absentResident = residents.find((r) => r.fullName === "Lê Minh Đức") ?? residents[0];

  await prisma.residencyEvent.createMany({
    data: [
      {
        residentId: tempResident.id,
        eventType: "TEMP_RESIDENCE",
        fromDate: new Date("2026-03-01"),
        toDate: new Date("2026-08-30"),
        note: "Đăng ký tạm trú 6 tháng",
        createdBy: "Lê Văn Dũng",
      },
      {
        residentId: absentResident.id,
        eventType: "TEMP_ABSENCE",
        fromDate: new Date("2026-02-10"),
        toDate: new Date("2026-02-20"),
        note: "Đi công tác",
        createdBy: "Lê Văn Dũng",
      },
      ...residents.slice(0, 70).map((r, idx) => ({
        residentId: r.id,
        eventType: idx % 4 === 0 ? "MOVE_IN" as const : idx % 4 === 1 ? "MOVE_OUT" as const : idx % 4 === 2 ? "TEMP_RESIDENCE" as const : "TEMP_ABSENCE" as const,
        fromDate: new Date(2024 + (idx % 3), (idx * 2) % 12, 2 + (idx % 20)),
        toDate: idx % 4 >= 2 ? new Date(2024 + (idx % 3), ((idx * 2) % 12) + 1, 12 + (idx % 10)) : null,
        note: idx % 2 === 0 ? "Cập nhật biến động theo hồ sơ cư trú" : "Bổ sung trạng thái cư trú",
        createdBy: idx % 2 === 0 ? "Lê Văn Dũng" : "Nguyễn Thu Hà",
      })),
    ],
  });

  const securityService = await prisma.feeType.create({ data: { code: "SECURITY_SERVICE", name: "Phí bảo vệ", category: "MANDATORY", calcMethod: "PER_M2", rate: 2800, graceDays: 5, lateFeeRule: "0.05%/day", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Ap dung toan khu", active: true } });
  const sanitationService = await prisma.feeType.create({ data: { code: "SANITATION_SERVICE", name: "Phí vệ sinh", category: "MANDATORY", calcMethod: "PER_M2", rate: 2200, graceDays: 5, lateFeeRule: "0.05%/day", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Ap dung toan khu", active: true } });
  const operationService = await prisma.feeType.create({ data: { code: "OPERATION_SERVICE", name: "Phí vận hành", category: "MANDATORY", calcMethod: "PER_M2", rate: 2000, graceDays: 5, lateFeeRule: "0.05%/day", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Ap dung toan khu", active: true } });
  const management = await prisma.feeType.create({ data: { code: "MANAGEMENT_FEE", name: "Phí quản lý", category: "MANDATORY", calcMethod: "PER_M2", rate: 2500, graceDays: 7, lateFeeRule: "0.03%/day", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Theo quy che quan ly", active: true } });
  const charity = await prisma.feeType.create({ data: { code: "CHARITY", name: "Quỹ từ thiện", category: "VOLUNTARY", calcMethod: "FIXED", rate: 120000, graceDays: 0, lateFeeRule: "", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Dong gop tu nguyen", active: true } });
  const seaIsland = await prisma.feeType.create({ data: { code: "SEA_ISLAND", name: "Quỹ biển đảo", category: "VOLUNTARY", calcMethod: "FIXED", rate: 80000, graceDays: 0, lateFeeRule: "", effectiveFrom: new Date("2025-01-01"), effectiveTo: null, policyNote: "Van dong theo dot", active: true } });

  const feeTypeById = new Map<number, { calcMethod: "PER_M2" | "FIXED"; rate: number }>([
    [securityService.id, { calcMethod: "PER_M2", rate: securityService.rate }],
    [sanitationService.id, { calcMethod: "PER_M2", rate: sanitationService.rate }],
    [operationService.id, { calcMethod: "PER_M2", rate: operationService.rate }],
    [management.id, { calcMethod: "PER_M2", rate: management.rate }],
    [charity.id, { calcMethod: "FIXED", rate: charity.rate }],
    [seaIsland.id, { calcMethod: "FIXED", rate: seaIsland.rate }],
  ]);

  const periods: Array<{ id: number; feeTypeId: number; month: number; year: number; status: "OPEN" | "CLOSED" }> = [];
  for (const year of [2022, 2023, 2024, 2025, 2026]) {
    const monthStart = 1;
    const monthEnd = 12;
    for (let month = monthStart; month <= monthEnd; month += 1) {
      for (const ft of [securityService, sanitationService, operationService]) {
        periods.push({
          id: (await prisma.feePeriod.create({ data: { feeTypeId: ft.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id,
          feeTypeId: ft.id,
          month,
          year,
          status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED",
        });
      }
      periods.push({
        id: (await prisma.feePeriod.create({ data: { feeTypeId: management.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id,
        feeTypeId: management.id,
        month,
        year,
        status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED",
      });
      if (month % 3 === 0) {
        periods.push({
          id: (await prisma.feePeriod.create({ data: { feeTypeId: charity.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id,
          feeTypeId: charity.id,
          month,
          year,
          status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED",
        });
      }
      if (month === 5 || month === 11) {
        periods.push({
          id: (await prisma.feePeriod.create({ data: { feeTypeId: seaIsland.id, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" } })).id,
          feeTypeId: seaIsland.id,
          month,
          year,
          status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED",
        });
      }
    }
  }

  let receiptIdx = 1;
  const overdueReference = new Date("2026-04-15").getTime();
  const targetOverdueApartments = new Set(["C-1009", "D-0301"]);
  for (const p of periods) {
    const feeType = feeTypeById.get(p.feeTypeId)!;
    const periodDueDate = new Date(p.year, p.month - 1, 1).getTime();
    const isOverdueAtReference = periodDueDate < overdueReference;
    for (const h of households) {
      const due = feeType.calcMethod === "PER_M2" ? h.areaM2 * feeType.rate : feeType.rate;
      const isTargetOverdueHousehold = targetOverdueApartments.has(h.apartmentNo);
      const inRecentOverdueWindow = p.year === 2026 && (p.month === 3 || p.month === 4);
      let paidRatio = 1;
      if (isOverdueAtReference && isTargetOverdueHousehold && inRecentOverdueWindow) {
        paidRatio = feeType.calcMethod === "PER_M2" ? 0.55 : 0.35;
      } else if (!isOverdueAtReference) {
        paidRatio = (h.id + p.month + p.year) % 3 === 0 ? 0.45 : 0.8;
      }
      const amountPaid = p.status === "OPEN" ? Math.round(due * Math.min(paidRatio, 0.5)) : Math.round(due * paidRatio);
      const obligation = await prisma.obligation.create({
        data: {
          periodId: p.id,
          householdId: h.id,
          amountDue: due,
          amountPaid,
        },
      });

      if (amountPaid > 0) {
        const chunks = amountPaid > 120000 ? [Math.round(amountPaid * 0.6), amountPaid - Math.round(amountPaid * 0.6)] : [amountPaid];
        for (let idx = 0; idx < chunks.length; idx += 1) {
          const date = new Date(p.year, p.month - 1, Math.min(25, 5 + idx * 10));
          const collector = idx % 2 === 0 ? "Nguyễn Thu Hà" : "Lê Văn Dũng";
          const payment = await prisma.payment.create({
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

          await prisma.auditLog.create({
            data: {
              actorUserId: createdUsers[1].id,
              action: "COLLECT_PAYMENT",
              entity: "PAYMENT",
              entityId: String(payment.id),
              detail: `Seed collected ${payment.paidAmount}`,
            },
          });
        }
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: createdUsers[0].id,
      action: "CREATE",
      entity: "SYSTEM",
      entityId: "SEED",
      detail: "Database seeded",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
