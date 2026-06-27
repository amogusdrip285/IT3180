# Hướng dẫn triển khai tính năng mới (Feature Implementation Guide)

Tài liệu này mô tả chi tiết các bước triển khai 5 nhóm tính năng còn thiếu cho hệ thống BlueMoon Web.

---

## Mục lục

1. [Tách chủ hộ khỏi căn hộ](#1-tách-chủ-hộ-khỏi-căn-hộ)
2. [Export báo cáo ra Excel](#2-export-báo-cáo-ra-file-excel)
3. [Giảm thông tin khi thu phí + Autofill](#3-giảm-thông-tin-khi-thu-phí--autofill)
4. [Admin mới được xóa biên lai](#4-admin-mới-được-xóa-biên-lai)
5. [Tab quản lý xe](#5-tab-quản-lý-xe)

---

## 1. Tách chủ hộ khỏi căn hộ

### Mục tiêu

Hiện tại model `Household` gộp `ownerName`/`ownerPhone` vào chính bảng căn hộ. Cần tách riêng:
- Một căn hộ **có thể không có chủ hộ** (owner là optional)
- Một người có thể làm chủ hộ cho một căn hộ
- Quan hệ giữa căn hộ và chủ hộ là **1-1 optional**

### Các bước thực hiện

#### Bước 1: Cập nhật Prisma schema

**File:** `prisma/schema.prisma`

Sửa model `Household`:

```prisma
model Household {
  id          Int             @id @default(autoincrement())
  apartmentNo String          @unique
  floorNo     Int
  // Xóa ownerName, ownerPhone — chuyển thành optional relation
  ownerId     Int?            // FK → Resident (nullable = căn hộ có thể không có chủ hộ)
  owner       Resident?       @relation("HeadOfHousehold", fields: [ownerId], references: [id])
  // ... giữ nguyên các field còn lại
  emergencyContactName String?
  emergencyContactPhone String?
  parkingSlots Int @default(0)
  moveInDate DateTime?
  ownershipStatus OwnershipStatus @default(OWNER)
  contractEndDate DateTime?
  areaM2      Float
  status      HouseholdStatus @default(ACTIVE)
  residents   Resident[]
  obligations Obligation[]
  communications CommunicationLog[]
  createdAt   DateTime @default(now())
}
```

Sửa model `Resident` — thêm relation ngược:

```prisma
model Resident {
  id           Int          @id @default(autoincrement())
  householdId  Int
  fullName     String
  phone        String?      // Thêm SĐT cho resident (dùng cho autofill)
  dob          DateTime
  gender       String
  idNo         String       @unique
  residentType ResidentType
  household    Household    @relation(fields: [householdId], references: [id], onDelete: Cascade)
  headOfHousehold Household? @relation("HeadOfHousehold") // 1-1 optional
  events       ResidencyEvent[]
  createdAt    DateTime     @default(now())

  @@index([householdId])
}
```

**Tạo migration:**
```bash
npx prisma migrate dev --name separate_owner_from_household
```

#### Bước 2: Cập nhật TypeScript types

**File:** `src/lib/types.ts`

```typescript
export type Household = {
  id: number;
  apartmentNo: string;
  floorNo: number;
  ownerId?: number | null;       // Thay ownerName
  owner?: { id: number; fullName: string; phone?: string } | null; // Khi include
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  parkingSlots?: number;
  moveInDate?: string | null;
  ownershipStatus?: "OWNER" | "TENANT";
  contractEndDate?: string | null;
  areaM2: number;
  status: "ACTIVE" | "INACTIVE";
};

export type Resident = {
  id: number;
  householdId: number;
  fullName: string;
  phone?: string;                // Thêm phone
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  idNo: string;
  residentType: "PERMANENT" | "TEMPORARY";
};
```

#### Bước 3: Sửa API households

**File:** `src/app/api/households/route.ts` (POST)

```typescript
const body = (await req.json()) as {
  apartmentNo: string;
  floorNo: number;
  ownerId?: number | null;       // Thay ownerName/ownerPhone
  // ... giữ nguyên các field còn lại
};
// Bỏ validation ownerName/ownerPhone
// Vẫn có thể validate nếu có ownerId thì owner phải tồn tại
if (body.ownerId) {
  const owner = await db.resident.findUnique({ where: { id: body.ownerId } });
  if (!owner) return apiError("NOT_FOUND", "Owner resident not found", 400, { field: "ownerId" });
}
```

**File:** `src/app/api/households/[id]/route.ts` (PATCH) — tương tự.

**File:** `src/app/api/households/route.ts` (GET) — thêm include:

```typescript
const rows = await db.household.findMany({
  orderBy: { id: "asc" },
  skip, take,
  include: { owner: { select: { id: true, fullName: true, phone: true } } },
});
```

#### Bước 4: Sửa API residents

**File:** `src/app/api/residents/route.ts` (POST/PATCH) — thêm field `phone`

```typescript
const body = (await req.json()) as {
  householdId: number;
  fullName: string;
  phone?: string;
  dob: string;
  gender: string;
  idNo: string;
  residentType: "PERMANENT" | "TEMPORARY";
};
```

**File:** `src/app/api/residents/[id]/route.ts` — thêm phone vào update data

#### Bước 5: Sửa giao diện frontend

**File:** `src/app/page.tsx`

**Phần form thêm/sửa Household:**
- Bỏ `ownerName` / `ownerPhone` input
- Thay bằng dropdown chọn Resident trong căn hộ đó làm chủ hộ
- Nếu chưa có resident, để trống (optional)

```tsx
// Trong phần households form
<select className="input" value={String(newOwnerId)} onChange={(e) => setNewOwnerId(Number(e.target.value))}>
  <option value="0">{l(lang, "Không có chủ hộ", "No head (optional)")}</option>
  {residents.filter((r) => r.householdId === editingHouseholdId || !editingHouseholdId).map((r) => (
    <option key={r.id} value={r.id}>{r.fullName} {r.phone ? `(${r.phone})` : ""}</option>
  ))}
</select>
```

**Bảng hiển thị households (dòng ~1602):**
- Cột "Chủ hộ" hiển thị `h.owner?.fullName ?? "-"` thay vì `h.ownerName`
- Cột SĐT hiển thị `h.owner?.phone ?? "-"`

#### Bước 6: Cập nhật seed data

**File:** `prisma/seed.ts` — cập nhật để tạo residents trước, gán `ownerId` sau.

---

## 2. Export báo cáo ra file Excel

### Mục tiêu

Hiện tại chỉ hỗ trợ CSV và PDF (dùng pdf-lib — không hỗ trợ tiếng Việt). Cần thêm:
- Export Excel (.xlsx) cho tất cả các báo cáo
- Format đẹp: có header style, độ rộng cột, border
- Hỗ trợ tiếng Việt đầy đủ

### Giải pháp

Dùng thư viện **ExcelJS** (hỗ trợ xlsx, utf-8, styling).

```bash
npm install exceljs
```

### Các bước thực hiện

#### Bước 1: Thêm hàm Excel helper

**File mới:** `src/lib/excel.ts`

```typescript
import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export async function makeExcelBuffer(
  title: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BlueMoon";
  const sheet = workbook.addWorksheet(title, {
    views: [{ showGridLines: false }],
  });

  // Title row
  const titleRow = sheet.addRow([title]);
  titleRow.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1A3A5C" } };
  sheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);
  sheet.addRow([]); // empty row

  // Header row
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A5C" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Set column widths
  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width ?? 15;
  });

  // Data rows
  rows.forEach((row) => {
    const dataRow = sheet.addRow(columns.map((c) => row[c.key] ?? ""));
    dataRow.font = { name: "Calibri", size: 10 };
    dataRow.alignment = { vertical: "middle" };
    // Alternate row color
    if (dataRow.number % 2 === 0) {
      dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7FB" } };
    }
  });

  // Border for data area
  const dataArea = sheet.getRows(3, rows.length + 1);
  if (dataArea) {
    dataArea.forEach((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

#### Bước 2: Sửa API route báo cáo

**File:** `src/app/api/reports/payments/route.ts`

Thêm format `xlsx`:

```typescript
import { makeExcelBuffer } from "@/lib/excel";

if (format === "xlsx") {
  const buffer = await makeExcelBuffer(
    "Báo cáo thu phí BlueMoon",
    [
      { header: "Mã phiếu thu", key: "receiptNo", width: 18 },
      { header: "Ngày thu", key: "paidAt", width: 20 },
      { header: "Người thu", key: "collector", width: 20 },
      { header: "Căn hộ", key: "apartment", width: 12 },
      { header: "Khoản phí", key: "feeType", width: 20 },
      { header: "Số tiền", key: "amount", width: 15 },
      { header: "Phương thức", key: "method", width: 12 },
      { header: "Ghi chú", key: "note", width: 25 },
    ],
    filtered.map((p) => {
      const period = p.obligation.period;
      return {
        receiptNo: p.receiptNo,
        paidAt: p.paidAt.toLocaleString("vi-VN"),
        collector: p.collectorName,
        apartment: p.obligation.household.apartmentNo,
        feeType: p.feeType.name,
        amount: p.paidAmount.toLocaleString("vi-VN") + " VND",
        method: p.method === "CASH" ? "Tiền mặt" : "Chuyển khoản",
        note: p.note,
      };
    }),
  );
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=payment_report.xlsx",
    },
  });
}
```

Làm tương tự cho:
- `src/app/api/reports/debt-summary/route.ts`
- `src/app/api/reports/residency/route.ts`

#### Bước 3: Thêm nút Export Excel trên frontend

**File:** `src/app/page.tsx`

Trong reports tab (~line 2273):

```tsx
<button className="btn-secondary" onClick={downloadPaymentsExcel}>
  {l(lang, "Xuất thu phí Excel", "Export payments Excel")}
</button>
<button className="btn-secondary" onClick={downloadResidencyExcel}>
  {l(lang, "Xuất cư trú Excel", "Export residency Excel")}
</button>
<button className="btn-secondary" onClick={() => downloadDebtSummaryExcel()}>
  {l(lang, "Xuất công nợ Excel", "Export debt Excel")}
</button>
```

Thêm các hàm:

```typescript
function downloadPaymentsExcel() {
  const params = new URLSearchParams();
  params.set("format", "xlsx");
  if (filterMonth !== "all") params.set("month", String(filterMonth));
  if (filterYear !== "all") params.set("year", String(filterYear));
  void downloadFile(`${API_BASE}/reports/payments?${params.toString()}`, "payment_report.xlsx");
}

function downloadResidencyExcel() {
  void downloadFile(`${API_BASE}/reports/residency?format=xlsx`, "residency_report.xlsx");
}

function downloadDebtSummaryExcel(householdId?: number) {
  const params = new URLSearchParams();
  params.set("format", "xlsx");
  if (householdId) params.set("householdId", String(householdId));
  void downloadFile(`${API_BASE}/reports/debt-summary?${params.toString()}`, "debt_summary.xlsx");
}
```

---

## 3. Giảm thông tin khi thu phí + Autofill

### Mục tiêu

1. **Cố định người thu là account hiện tại** — không cần dropdown chọn collector
2. **Autofill người đóng tiền** — khi chọn obligation, tự động điền tên + SĐT của chủ hộ hoặc cư dân

### Các bước thực hiện

#### Bước 3.1: Cố định người thu

**File:** `src/app/page.tsx`

**State:** Bỏ `collectorName` state hoặc set mặc định từ `user.fullName`.

Tìm dòng khai báo state:
```typescript
const [collectorName, setCollectorName] = useState("");
// => Thay bằng:
const collectorName = user?.fullName ?? "";
// Xóa setCollectorName
```

**UI:** Thay dropdown collector bằng text hiển thị cố định:

```tsx
// Thay thế (dòng ~1889-1893):
<select className="input" value={collectorName} ...>
  ...
</select>
// Bằng:
<div>
  <input className="input" value={collectorName} disabled placeholder={l(lang, "Người thu", "Collector")} />
  <p className="muted" style={{ fontSize: 12 }}>{l(lang, "Tự động theo tài khoản hiện tại", "Auto-set to current account")}</p>
</div>
```

**API:** Trong `src/app/api/payments/route.ts`, bỏ validate `collectorName` — nếu không có thì set mặc định từ `auth.user!.fullName`:

```typescript
collectorName: body.collectorName || auth.user!.fullName,
```

Hoặc trên frontend, gửi `collectorName: user.fullName` luôn.

#### Bước 3.2: Autofill theo thông tin người đóng

Khi chọn obligation trong form thu phí, tự động điền:
- `payerName` = tên chủ hộ (hoặc resident đầu tiên)
- `payerPhone` = SĐT chủ hộ (hoặc SĐT resident đầu tiên)

**File:** `src/app/page.tsx`

Thêm effect:

```typescript
useEffect(() => {
  if (!selectedObligation) {
    setPayerName("");
    setPayerPhone("");
    return;
  }
  const h = householdById.get(selectedObligation.householdId);
  if (!h) return;
  // Ưu tiên owner (chủ hộ), fallback về resident đầu tiên
  const ownerResident = residents.find((r) => r.id === h.ownerId);
  if (ownerResident) {
    setPayerName(ownerResident.fullName);
    setPayerPhone(ownerResident.phone ?? "");
  } else if (h.ownerName) { // fallback cũ
    setPayerName(h.ownerName);
    setPayerPhone(h.ownerPhone);
  } else {
    // Lấy resident đầu tiên của căn hộ
    const firstResident = residents.find((r) => r.householdId === h.id);
    if (firstResident) {
      setPayerName(firstResident.fullName);
      setPayerPhone(firstResident.phone ?? "");
    }
  }
}, [selectedObligation, householdById, residents]);
```

**Bỏ các dropdown payerName/payerPhone** — thay bằng input disabled (display only) hoặc để editable nhưng đã có sẵn dữ liệu:

```tsx
<input className="input" value={payerName}
  onChange={(e) => setPayerName(e.target.value)}
  placeholder={l(lang, "Người nộp (tự động)", "Payer (auto-filled)")}
/>
<input className="input" value={payerPhone}
  onChange={(e) => setPayerPhone(e.target.value)}
  placeholder={l(lang, "SĐT (tự động)", "Phone (auto-filled)")}
/>
```

#### Bước 3.3: Cập nhật validation ở API

**File:** `src/app/api/payments/route.ts`

Bỏ yêu cầu `collectorName` — nếu không có, dùng `auth.user.fullName`:

```typescript
collectorName: body.collectorName || auth.user!.fullName,
```

---

## 4. Admin mới được quyền xóa biên lai

### Mục tiêu

Hiện tại permission `FEE_WRITE` cho phép Accountant và Admin xóa biên lai. Cần:
- Chỉ **Admin** mới được DELETE payment
- Các role khác (Accountant, Team Leader) thấy nút xóa nhưng báo lỗi "Liên hệ Admin" hoặc ẩn hẳn

### Các bước thực hiện

#### Bước 4.1: Sửa API backend

**File:** `src/app/api/payments/[id]/route.ts`

```typescript
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  // Chỉ ADMIN mới được xóa
  const roleCodes = auth.user!.roleCodes ?? [auth.user!.role];
  if (!roleCodes.includes("ADMIN")) {
    return apiError("FORBIDDEN", "Only admin can delete receipts. Please contact admin.", 403);
  }

  // ... phần còn lại giữ nguyên
}
```

#### Bước 4.2: Ẩn nút xóa trên frontend

**File:** `src/app/page.tsx`

Tìm dòng render nút xóa (dòng ~1972):

```tsx
// Thay vì:
<button className="btn-danger" onClick={() => deletePayment(p.id)}>
  {l(lang, "Xóa", "Delete")}
</button>

// Bằng:
{canPermission(user, "SYSTEM", "ADMIN") && (
  <button className="btn-danger" onClick={() => deletePayment(p.id)}>
    {l(lang, "Xóa", "Delete")}
  </button>
)}
```

Kiểm tra hàm `canPermission`: `ADMIN` role có `SYSTEM_ADMIN` permission (trong `seed.ts`). Nếu không chắc, có thể check trực tiếp:

```typescript
user?.role === "ADMIN" || (user?.roleCodes ?? []).includes("ADMIN")
```

#### Bước 4.3: Cập nhật permission seed

**File:** `prisma/seed.ts`

Đảm bảo permission `SYSTEM_ADMIN` chỉ gắn cho role ADMIN.

---

## 5. Tab quản lý xe (Vehicle Management)

### Mục tiêu

Thêm tab quản lý xe trong khu chung cư, gồm **2 phần**:
1. **Danh sách xe** của từng căn hộ (biển số, loại xe)
2. **Log ra/vào** — ghi lại xe nào ra/vào cổng ở thời gian nào  
   → Chỉ cần 4 trường: **Hộ khẩu → Xe → Ra/Vào → Thời gian**

Thêm role **bảo vệ (GUARD)** — chỉ có quyền ghi log ra/vào, không sửa được danh sách xe hay dữ liệu khác.

### Các bước thực hiện

#### Bước 5.1: Thêm enum và model mới

**File:** `prisma/schema.prisma`

```prisma
enum VehicleType {
  CAR
  MOTORBIKE
  BICYCLE
  OTHER
}

enum VehicleLogDirection {
  IN
  OUT
}
```

Thêm model `Vehicle` và `VehicleLog`:

```prisma
model Vehicle {
  id            Int         @id @default(autoincrement())
  householdId   Int
  licensePlate  String      @unique
  vehicleType   VehicleType
  brand         String?
  color         String?
  note          String      @default("")
  registeredAt  DateTime    @default(now())
  household     Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  logs          VehicleLog[]

  @@index([householdId])
  @@index([licensePlate])
}

model VehicleLog {
  id        Int                @id @default(autoincrement())
  vehicleId Int
  direction VehicleLogDirection
  timestamp DateTime           @default(now())
  note      String             @default("")
  vehicle   Vehicle            @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId])
  @@index([timestamp])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_vehicle_and_log
```

#### Bước 5.2: Thêm role GUARD

**File:** `prisma/schema.prisma` — thêm vào enum `Role`:

```prisma
enum Role {
  ADMIN
  ACCOUNTANT
  TEAM_LEADER
  GUARD
}
```

**File:** `prisma/seed.ts` — thêm role GUARD với quyền `VEHICLE_LOG`:

```typescript
// Thêm permission mới
await tx.permission.createMany({
  data: [
    { code: "VEHICLE_LOG", name: "Vehicle log access", module: "VEHICLE" },
    { code: "VEHICLE_WRITE", name: "Vehicle management", module: "VEHICLE" },
  ],
  skipDuplicates: true,
});

// Tạo role GUARD
const guardRole = await tx.appRole.upsert({
  where: { code: "GUARD" },
  update: {},
  create: { code: "GUARD", name: "Bảo vệ", description: "Chỉ ghi log ra/vào xe" },
});

// Gán permission VEHICLE_LOG cho GUARD
const guardPerm = await tx.permission.findUnique({ where: { code: "VEHICLE_LOG" } });
if (guardPerm) {
  await tx.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: guardRole.id, permissionId: guardPerm.id } },
    update: {},
    create: { roleId: guardRole.id, permissionId: guardPerm.id },
  });
}
```

Cập nhật seed cho role ACCOUNTANT / ADMIN để họ có `VEHICLE_WRITE` và `VEHICLE_LOG`.

#### Bước 5.3: Thêm TypeScript types

**File:** `src/lib/types.ts`

```typescript
export type Role = "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER" | "GUARD";

export type VehicleType = "CAR" | "MOTORBIKE" | "BICYCLE" | "OTHER";

export type Vehicle = {
  id: number;
  householdId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  brand?: string;
  color?: string;
  note?: string;
  registeredAt: string;
};

export type VehicleLogDirection = "IN" | "OUT";

export type VehicleLog = {
  id: number;
  vehicleId: number;
  direction: VehicleLogDirection;
  timestamp: string;
  note?: string;
};
```

#### Bước 5.4: Thêm API routes (Vehicle CRUD)

**File mới:** `src/app/api/vehicles/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.vehicle.findMany({
    orderBy: { id: "desc" },
    skip, take,
    include: { household: { select: { apartmentNo: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;

  const body = (await req.json()) as {
    householdId: number;
    licensePlate: string;
    vehicleType: "CAR" | "MOTORBIKE" | "BICYCLE" | "OTHER";
    brand?: string;
    color?: string;
    note?: string;
  };
  if (!body.householdId || !body.licensePlate || !body.vehicleType) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }
  const existing = await db.vehicle.findUnique({ where: { licensePlate: body.licensePlate } });
  if (existing) return apiError("DUPLICATE_DATA", "License plate already exists", 409);

  const row = await db.vehicle.create({
    data: {
      householdId: body.householdId,
      licensePlate: body.licensePlate.toUpperCase(),
      vehicleType: body.vehicleType,
      brand: body.brand || null,
      color: body.color || null,
      note: body.note || "",
    },
  });

  await writeAudit({
    actorUserId: auth.user!.id,
    action: "CREATE",
    entity: "VEHICLE",
    entityId: String(row.id),
    detail: `Created vehicle ${row.licensePlate}`,
  });

  return NextResponse.json(row);
}
```

**File mới:** `src/app/api/vehicles/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/errors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;

  const { id } = await ctx.params;
  const num = Number(id);
  const body = (await req.json()) as {
    licensePlate?: string;
    vehicleType?: "CAR" | "MOTORBIKE" | "BICYCLE" | "OTHER";
    brand?: string;
    color?: string;
    note?: string;
  };

  const row = await db.vehicle.update({ where: { id: num }, data: body });
  await writeAudit({ actorUserId: auth.user!.id, action: "UPDATE", entity: "VEHICLE", entityId: String(row.id), detail: `Updated vehicle ${row.licensePlate}` });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { id } = await ctx.params;
  const num = Number(id);
  await db.vehicle.delete({ where: { id: num } });
  await writeAudit({ actorUserId: auth.user!.id, action: "DELETE", entity: "VEHICLE", entityId: String(num), detail: `Deleted vehicle id ${num}` });
  return NextResponse.json({ ok: true });
}
```

#### Bước 5.5: Thêm API routes (Vehicle Log)

**File mới:** `src/app/api/vehicle-logs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { parsePagination } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "LOG");
  if (deny) return deny;
  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.vehicleLog.findMany({
    orderBy: { timestamp: "desc" },
    skip, take,
    include: {
      vehicle: {
        include: { household: { select: { apartmentNo: true } } },
      },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  // GUARD + ADMIN + ACCOUNTANT đều có VEHICLE_LOG
  const deny = requirePermission(auth.user!, "VEHICLE", "LOG");
  if (deny) return deny;

  const body = (await req.json()) as {
    vehicleId: number;
    direction: "IN" | "OUT";
    timestamp?: string;
    note?: string;
  };
  if (!body.vehicleId || !body.direction) {
    return apiError("VALIDATION_ERROR", "Missing required fields", 400);
  }

  const row = await db.vehicleLog.create({
    data: {
      vehicleId: body.vehicleId,
      direction: body.direction,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      note: body.note || "",
    },
  });
  return NextResponse.json(row);
}
```

**File mới:** `src/app/api/vehicle-logs/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/errors";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "VEHICLE", "WRITE");
  if (deny) return deny;
  const { id } = await ctx.params;
  await db.vehicleLog.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
```

#### Bước 5.6: Thêm tab trên frontend

**File:** `src/app/page.tsx`

**a) Thêm type Tab:**

```typescript
type Tab = "dashboard" | "fees" | "periods" | "obligations" | "households" | "residents" | "events" | "vehicles" | "users" | "reports" | "account" | "handbook";
```

**b) Thêm state:**

```typescript
const [vehicles, setVehicles] = useState<Vehicle[]>([]);
const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);

// Form đăng ký xe (dành cho ADMIN/ACCOUNTANT)
const [newVehicleHouseholdId, setNewVehicleHouseholdId] = useState<number>(0);
const [newVehicleLicensePlate, setNewVehicleLicensePlate] = useState("");
const [newVehicleType, setNewVehicleType] = useState<VehicleType>("CAR");
const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);

// Form log ra/vào (dành cho GUARD + ADMIN/ACCOUNTANT) — chỉ 4 trường
const [logVehicleId, setLogVehicleId] = useState<number>(0);
const [logDirection, setLogDirection] = useState<VehicleLogDirection>("IN");
const [logTimestamp, setLogTimestamp] = useState("");
```

**c) Fetch data trong `refreshAllFromApi`:**

```typescript
const [..., v, vl] = await Promise.all([
  // ... existing fetches
  apiGetAllPages<Vehicle>(`${API_BASE}/vehicles`),
  apiGetAllPages<VehicleLog>(`${API_BASE}/vehicle-logs`),
]);
setVehicles(v);
setVehicleLogs(vl);
```

**d) Hiển thị tab sidebar:**

**File:** `src/components/Sidebar.tsx` — thêm mục "vehicles".

**e) Tab content (chèn sau tab events, khoảng dòng 2060):**

```tsx
{tab === "vehicles" && (
  <section className="card">
    <div className="flex items-center justify-between">
      <h2 className="subtitle">{l(lang, "Quản lý xe", "Vehicle Management")}</h2>
    </div>

    {/* Phần dành cho GUARD + người có VEHICLE_LOG: Log ra/vào — chỉ 4 trường */}
    <section className="card mt-3">
      <h3 className="subtitle">{l(lang, "Ghi nhận xe ra/vào", "Vehicle entry/exit log")}</h3>
      <p className="muted mt-1">{l(lang, "Chọn hộ → chọn xe → ra/vào → thời gian", "Select household → vehicle → in/out → time")}</p>
      {canPermission(user, "VEHICLE", "LOG") && (
        <div className="grid gap-2 mt-2 md:grid-cols-4">
          <select className="input" value={String(logSelectedHouseholdId)} onChange={(e) => {
            const hhId = Number(e.target.value);
            setLogSelectedHouseholdId(hhId);
            setLogVehicleId(0);
          }}>
            <option value="0">{l(lang, "Chọn hộ khẩu *", "Select household *")}</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.apartmentNo}</option>
            ))}
          </select>
          <select className="input" value={logVehicleId} onChange={(e) => setLogVehicleId(Number(e.target.value))} disabled={!logSelectedHouseholdId}>
            <option value="0">{l(lang, "Chọn xe *", "Select vehicle *")}</option>
            {vehicles.filter((v) => v.householdId === logSelectedHouseholdId).map((v) => (
              <option key={v.id} value={v.id}>{v.licensePlate} ({v.vehicleType})</option>
            ))}
          </select>
          <select className="input" value={logDirection} onChange={(e) => setLogDirection(e.target.value as VehicleLogDirection)}>
            <option value="IN">{l(lang, "Vào", "In")}</option>
            <option value="OUT">{l(lang, "Ra", "Out")}</option>
          </select>
          <div className="flex gap-2">
            <input className="input" type="datetime-local" value={logTimestamp} onChange={(e) => setLogTimestamp(e.target.value)} />
            <button className="btn-primary" onClick={addVehicleLog}>{l(lang, "Ghi", "Log")}</button>
          </div>
        </div>
      )}
    </section>

    {/* Bảng log ra/vào — ai cũng xem được */}
    <div className="table-wrap mt-3">
      <table>
        <thead><tr>
          <th>{t(lang, "apartment")}</th>
          <th>{l(lang, "Biển số", "Plate")}</th>
          <th>{l(lang, "Hướng", "Direction")}</th>
          <th>{l(lang, "Thời gian", "Time")}</th>
        </tr></thead>
        <tbody>
          {vehicleLogs.slice(0, 50).map((log) => {
            const v = vehicles.find((x) => x.id === log.vehicleId);
            const hh = v ? householdById.get(v.householdId) : null;
            return (
              <tr key={log.id}>
                <td>{hh?.apartmentNo ?? "-"}</td>
                <td>{v?.licensePlate ?? "-"}</td>
                <td><span className={`pill ${log.direction === "IN" ? "pill-owner" : "pill-tenant"}`}>{log.direction === "IN" ? "Vào" : "Ra"}</span></td>
                <td>{new Date(log.timestamp).toLocaleString("vi-VN")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Phần quản lý danh sách xe — chỉ VEHICLE_WRITE mới thấy */}
    {canPermission(user, "VEHICLE", "WRITE") && (
      <>
        <h3 className="subtitle mt-4">{l(lang, "Danh sách xe đăng ký", "Registered vehicles")}</h3>
        <div className="grid gap-2 mt-2 md:grid-cols-4">
          <select className="input" value={newVehicleHouseholdId} onChange={(e) => setNewVehicleHouseholdId(Number(e.target.value))}>
            <option value="0">{l(lang, "Chọn căn hộ *", "Select household *")}</option>
            {households.map((h) => <option key={h.id} value={h.id}>{h.apartmentNo}</option>)}
          </select>
          <input className="input" value={newVehicleLicensePlate} onChange={(e) => setNewVehicleLicensePlate(e.target.value)} placeholder={l(lang, "Biển số *", "Plate *")} />
          <select className="input" value={newVehicleType} onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}>
            <option value="CAR">{l(lang, "Ô tô", "Car")}</option>
            <option value="MOTORBIKE">{l(lang, "Xe máy", "Motorbike")}</option>
            <option value="BICYCLE">{l(lang, "Xe đạp", "Bicycle")}</option>
            <option value="OTHER">{l(lang, "Khác", "Other")}</option>
          </select>
          {editingVehicleId ? (
            <div className="flex gap-2"><button className="btn-primary" onClick={saveVehicleEdit}>{l(lang, "Lưu", "Save")}</button><button className="btn-secondary" onClick={() => setEditingVehicleId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
          ) : (
            <button className="btn-primary" onClick={addVehicle}>{l(lang, "Thêm xe", "Add")}</button>
          )}
        </div>
        <div className="table-wrap mt-2">
          <table>
            <thead><tr>
              <th>{t(lang, "apartment")}</th>
              <th>{l(lang, "Biển số", "Plate")}</th>
              <th>{l(lang, "Loại", "Type")}</th>
              <th>{l(lang, "Thao tác", "Actions")}</th>
            </tr></thead>
            <tbody>
              {vehicles.map((v) => {
                const hh = householdById.get(v.householdId);
                return (
                  <tr key={v.id}>
                    <td>{hh?.apartmentNo ?? v.householdId}</td>
                    <td>{v.licensePlate}</td>
                    <td>{v.vehicleType}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-secondary" onClick={() => {
                          setEditingVehicleId(v.id);
                          setNewVehicleHouseholdId(v.householdId);
                          setNewVehicleLicensePlate(v.licensePlate);
                          setNewVehicleType(v.vehicleType);
                        }}>{l(lang, "Sửa", "Edit")}</button>
                        <button className="btn-danger" onClick={() => deleteVehicle(v.id)}>{l(lang, "Xóa", "Delete")}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    )}
  </section>
)}
```

**f) Thêm các hàm xử lý:**

```typescript
function addVehicleLog() {
  if (!logVehicleId || !logDirection) {
    notify("error", l(lang, "Vui lòng chọn xe và hướng", "Select vehicle and direction"));
    return;
  }
  void apiPost(`${API_BASE}/vehicle-logs`, {
    vehicleId: logVehicleId,
    direction: logDirection,
    timestamp: logTimestamp || undefined,
  }).then(async () => {
    await refreshAllFromApi();
    setLogVehicleId(0);
    setLogDirection("IN");
    setLogTimestamp("");
    setLogSelectedHouseholdId(0);
  });
}

function addVehicle() {
  if (!newVehicleHouseholdId || !newVehicleLicensePlate.trim() || !newVehicleType) {
    notify("error", l(lang, "Vui lòng điền đủ thông tin bắt buộc", "Please fill all required fields"));
    return;
  }
  void apiPost(`${API_BASE}/vehicles`, {
    householdId: newVehicleHouseholdId,
    licensePlate: newVehicleLicensePlate.trim().toUpperCase(),
    vehicleType: newVehicleType,
  }).then(async () => {
    await refreshAllFromApi();
    setNewVehicleHouseholdId(0);
    setNewVehicleLicensePlate("");
    setNewVehicleType("CAR");
  });
}

function saveVehicleEdit() {
  if (!editingVehicleId) return;
  void fetch(`${API_BASE}/vehicles/${editingVehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      licensePlate: newVehicleLicensePlate.trim().toUpperCase(),
      vehicleType: newVehicleType,
    }),
  }).then(async () => {
    setEditingVehicleId(null);
    await refreshAllFromApi();
  });
}

function deleteVehicle(id: number) {
  if (!window.confirm(l(lang, "Bạn có chắc muốn xóa xe này?", "Are you sure?"))) return;
  void runAction(
    `delete-vehicle-${id}`,
    async () => {
      const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
      await refreshAllFromApi();
    },
    l(lang, "Đã xóa xe", "Vehicle deleted"),
    l(lang, "Xóa xe thất bại", "Failed to delete vehicle"),
  );
}
```

**g) Cập nhật visibleTabs:**

```typescript
if (canPermission(user, "VEHICLE", "LOG") || canPermission(user, "VEHICLE", "WRITE")) {
  tabs.push("vehicles");
}
```

**h) Cập nhật i18n:**

**File:** `src/lib/i18n.ts`

```typescript
// en:
vehicles: "Vehicles",
// vi:
vehicles: "Xe cộ",
```

#### Bước 5.7: Cập nhật Sidebar

**File:** `src/components/Sidebar.tsx` — thêm tab "vehicles".

#### Bước 5.8: Cập nhật permission check helper

**File:** `src/lib/permission.ts`

```typescript
export function canPermission(user: User | null, module: "SYSTEM" | "FEE" | "RESIDENT" | "REPORT" | "VEHICLE", action: "READ" | "WRITE" | "ADMIN" | "LOG"): boolean {
  // ...
}
```

#### Bước 5.9: Cập nhật view cho GUARD role

**File:** `src/app/page.tsx` (trong `visibleTabs`):

GUARD chỉ nên thấy tab **vehicles** (và account/handbook):

```typescript
const visibleTabs = useMemo(() => {
  if (!user) return ["handbook"] as Tab[];
  const tabs: Tab[] = ["dashboard", "account"];
  if (canPermission(user, "FEE", "READ")) tabs.push("fees", "periods", "obligations");
  if (canPermission(user, "RESIDENT", "READ")) tabs.push("households", "residents", "events");
  if (canPermission(user, "SYSTEM", "ADMIN")) tabs.push("users");
  if (canPermission(user, "REPORT", "READ")) tabs.push("reports");
  if (canPermission(user, "VEHICLE", "LOG") || canPermission(user, "VEHICLE", "WRITE")) tabs.push("vehicles");
  tabs.push("handbook");
  return tabs;
}, [user]);
```

---

## Tổng hợp thứ tự triển khai đề xuất

| Thứ tự | Tính năng | Độ phức tạp | Phụ thuộc |
|--------|-----------|-------------|-----------|
| 1 | Feature 4: Admin xóa biên lai | Dễ | Không |
| 2 | Feature 2: Export Excel | Dễ | Không |
| 3 | Feature 5: Quản lý xe + log ra/vào + role GUARD | Trung bình | Cần migration, seed mới |
| 4 | Feature 3: Giảm thông tin + Autofill | Trung bình | Feature 1 (nếu autofill theo chủ hộ mới) |
| 5 | Feature 1: Tách chủ hộ khỏi căn hộ | Khó | Cần migration |

> **Gợi ý:** Nên làm Feature 2 và Feature 4 trước vì độc lập, dễ triển khai nhanh. Feature 5 có thể làm song song với Feature 1/3.
