import type {
  FeePeriod,
  FeeType,
  Household,
  Obligation,
  Payment,
  Resident,
  User,
} from "./types";

function makeReceiptNo(year: number, month: number, idx: number): string {
  return `PT-${year}${String(month).padStart(2, "0")}-${String(idx).padStart(5, "0")}`;
}

export const usersSeed: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@bluemoon.vn",
    phone: "0912.000.001",
    fullName: "Trưởng Ban Quản Trị",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: new Date("2026-01-02").toISOString(),
  },
  {
    id: 2,
    username: "accountant",
    email: "ketoan@bluemoon.vn",
    phone: "0912.000.002",
    fullName: "Nguyễn Thu Hà",
    role: "ACCOUNTANT",
    status: "ACTIVE",
    createdAt: new Date("2026-01-02").toISOString(),
  },
  {
    id: 3,
    username: "leader",
    email: "totruong@bluemoon.vn",
    phone: "0912.000.003",
    fullName: "Lê Văn Dũng",
    role: "TEAM_LEADER",
    status: "ACTIVE",
    createdAt: new Date("2026-01-02").toISOString(),
  },
];

export const householdsSeed: Household[] = [
  { id: 1, apartmentNo: "A-1203", floorNo: 12, ownerName: "Nguyễn Văn An", ownerPhone: "0903.111.203", areaM2: 68, status: "ACTIVE" },
  { id: 2, apartmentNo: "B-1805", floorNo: 18, ownerName: "Trần Thị Hoa", ownerPhone: "0903.222.805", areaM2: 82, status: "ACTIVE" },
  { id: 3, apartmentNo: "C-2201", floorNo: 22, ownerName: "Lê Minh Đức", ownerPhone: "0903.333.201", areaM2: 95, status: "ACTIVE" },
  { id: 4, apartmentNo: "A-0906", floorNo: 9, ownerName: "Phạm Hồng Hải", ownerPhone: "0903.444.906", areaM2: 60, status: "ACTIVE" },
  { id: 5, apartmentNo: "B-1102", floorNo: 11, ownerName: "Đào Thị Lan", ownerPhone: "0903.555.102", areaM2: 74, status: "ACTIVE" },
  { id: 6, apartmentNo: "C-1508", floorNo: 15, ownerName: "Vũ Quốc Bình", ownerPhone: "0903.666.508", areaM2: 88, status: "ACTIVE" },
];

export const residentsSeed: Resident[] = [
  { id: 1, householdId: 1, fullName: "Nguyễn Văn An", dob: "1987-02-03", gender: "MALE", idNo: "012345678901", residentType: "PERMANENT" },
  { id: 2, householdId: 1, fullName: "Nguyễn Thị Mai", dob: "1990-06-11", gender: "FEMALE", idNo: "012345678902", residentType: "PERMANENT" },
  { id: 3, householdId: 2, fullName: "Trần Thị Hoa", dob: "1984-03-20", gender: "FEMALE", idNo: "012345678903", residentType: "PERMANENT" },
  { id: 4, householdId: 3, fullName: "Lê Minh Đức", dob: "1982-12-09", gender: "MALE", idNo: "012345678904", residentType: "PERMANENT" },
  { id: 5, householdId: 4, fullName: "Phạm Hồng Hải", dob: "1993-01-15", gender: "MALE", idNo: "012345678905", residentType: "PERMANENT" },
  { id: 6, householdId: 5, fullName: "Đào Thị Lan", dob: "1991-09-29", gender: "FEMALE", idNo: "012345678906", residentType: "PERMANENT" },
  { id: 7, householdId: 6, fullName: "Vũ Quốc Bình", dob: "1988-07-05", gender: "MALE", idNo: "012345678907", residentType: "PERMANENT" },
  { id: 8, householdId: 6, fullName: "Vũ Ngọc Anh", dob: "2001-11-18", gender: "FEMALE", idNo: "012345678908", residentType: "TEMPORARY" },
];

export const feeTypesSeed: FeeType[] = [
  { id: 1, code: "SERVICE_FEE", name: "Phí dịch vụ", category: "MANDATORY", calcMethod: "PER_M2", rate: 7000, active: true },
  { id: 2, code: "MANAGEMENT_FEE", name: "Phí quản lý", category: "MANDATORY", calcMethod: "PER_M2", rate: 2500, active: true },
  { id: 3, code: "CHARITY", name: "Quỹ từ thiện", category: "VOLUNTARY", calcMethod: "FIXED", rate: 120000, active: true },
  { id: 4, code: "SEA_ISLAND", name: "Quỹ biển đảo", category: "VOLUNTARY", calcMethod: "FIXED", rate: 80000, active: true },
];

const periodTemplate: Array<{ id: number; feeTypeId: number; month: number; year: number; status: "OPEN" | "CLOSED" }> = [];
let periodId = 1;
for (const year of [2025, 2026]) {
  const monthStart = year === 2025 ? 9 : 1;
  const monthEnd = year === 2025 ? 12 : 12;
  for (let month = monthStart; month <= monthEnd; month += 1) {
    periodTemplate.push({ id: periodId++, feeTypeId: 1, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
    periodTemplate.push({ id: periodId++, feeTypeId: 2, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
    if (month % 3 === 0) {
      periodTemplate.push({ id: periodId++, feeTypeId: 3, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
    }
    if (month === 5 || month === 11) {
      periodTemplate.push({ id: periodId++, feeTypeId: 4, month, year, status: year === 2026 && month >= 10 ? "OPEN" : "CLOSED" });
    }
  }
}

export const periodsSeed: FeePeriod[] = periodTemplate;

export const obligationsSeed: Obligation[] = [];
let obligationId = 1;
for (const p of periodsSeed) {
  const feeType = feeTypesSeed.find((f) => f.id === p.feeTypeId)!;
  for (const h of householdsSeed) {
    const due = feeType.calcMethod === "PER_M2" ? h.areaM2 * feeType.rate : feeType.rate;
    const paidRatio = ((h.id + p.month + p.year) % 4) / 4;
    const amountPaid = p.status === "OPEN" ? Math.round(due * Math.min(paidRatio, 0.35)) : Math.round(due * paidRatio);
    obligationsSeed.push({ id: obligationId++, periodId: p.id, householdId: h.id, amountDue: due, amountPaid });
  }
}

export const paymentsSeed: Payment[] = [];
let paymentId = 1;
let receiptCounter = 1;
for (const o of obligationsSeed) {
  if (o.amountPaid <= 0) continue;
  const period = periodsSeed.find((p) => p.id === o.periodId)!;
  const split = o.amountPaid > 120000 ? [Math.round(o.amountPaid * 0.6), o.amountPaid - Math.round(o.amountPaid * 0.6)] : [o.amountPaid];

  split.forEach((chunk, idx) => {
    const date = new Date(period.year, period.month - 1, Math.min(25, 5 + idx * 10));
    const collectorName = idx % 2 === 0 ? "Nguyễn Thu Hà" : "Lê Văn Dũng";
    paymentsSeed.push({
      id: paymentId++,
      obligationId: o.id,
      feeTypeId: period.feeTypeId,
      paidAmount: chunk,
      method: (idx + o.id) % 2 === 0 ? "BANK" : "CASH",
      paidAt: date.toISOString(),
      collectorName,
      receiptNo: makeReceiptNo(period.year, period.month, receiptCounter++),
      note: "Thu theo đợt định kỳ",
    });
  });
}
