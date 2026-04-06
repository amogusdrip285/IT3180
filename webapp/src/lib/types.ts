export type Lang = "en" | "vi";

export type Role = "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER";

export type User = {
  id: number;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  role: Role;
  roleCodes?: string[];
  permissionCodes?: string[];
  userRoles?: Array<{ role: { id: number; code: string; name: string } }>;
  status: "ACTIVE" | "BLOCKED";
  createdAt?: string;
};

export type AppRole = {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions?: Array<{ permission: PermissionItem }>;
  userRoles?: Array<{ userId: number; roleId: number }>;
};

export type PermissionItem = {
  id: number;
  code: string;
  name: string;
  module: string;
  screen: string;
  description: string;
};

export type Household = {
  id: number;
  apartmentNo: string;
  floorNo: number;
  ownerName: string;
  ownerPhone: string;
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
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  idNo: string;
  residentType: "PERMANENT" | "TEMPORARY";
};

export type FeeType = {
  id: number;
  code: string;
  name: string;
  category: "MANDATORY" | "VOLUNTARY";
  calcMethod: "PER_M2" | "FIXED";
  rate: number;
  graceDays?: number;
  lateFeeRule?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  policyNote?: string;
  active: boolean;
};

export type FeePeriod = {
  id: number;
  feeTypeId: number;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED";
};

export type Obligation = {
  id: number;
  periodId: number;
  householdId: number;
  amountDue: number;
  amountPaid: number;
};

export type Payment = {
  id: number;
  obligationId: number;
  feeTypeId: number;
  paidAmount: number;
  method: "CASH" | "BANK";
  paidAt: string;
  collectorName: string;
  payerName?: string;
  payerPhone?: string;
  bankTxRef?: string;
  attachmentUrl?: string;
  reversalNote?: string;
  receiptNo: string;
  note: string;
};

export type CommunicationLog = {
  id: number;
  householdId: number;
  sentAt: string;
  channel: "SMS" | "EMAIL" | "ZALO" | "NOTICE";
  status: "PENDING" | "SENT" | "FAILED";
  note: string;
};

export type ResidencyEvent = {
  id: number;
  residentId: number;
  eventType: "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT";
  fromDate: string;
  toDate: string;
  note: string;
  createdBy: string;
};
