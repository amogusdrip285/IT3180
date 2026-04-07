"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@/components/BarChart";
import { AccountPanel } from "@/components/AccountPanel";
import { AuthCard } from "@/components/AuthCard";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Sidebar } from "@/components/Sidebar";
import { apiGet, apiPost } from "@/lib/api";
import { canPermission } from "@/lib/permission";
import { t } from "@/lib/i18n";
import type { AppRole, CommunicationLog, FeePeriod, FeeType, Household, Lang, Obligation, Payment, PermissionItem, ResidencyEvent, Resident, User } from "@/lib/types";

type Tab = "dashboard" | "fees" | "periods" | "obligations" | "households" | "residents" | "events" | "users" | "reports" | "account" | "handbook";
const API_BASE = "/api";

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function l(lang: Lang, vi: string, en: string): string {
  return lang === "vi" ? vi : en;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("vi");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedMonthDrilldown, setSelectedMonthDrilldown] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissionItems, setPermissionItems] = useState<PermissionItem[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [periods, setPeriods] = useState<FeePeriod[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<ResidencyEvent[]>([]);
  const [communications, setCommunications] = useState<Array<CommunicationLog & { household?: Household }>>([]);
  const [analytics, setAnalytics] = useState<{
    aging: Array<{ label: string; count: number; amount: number }>;
    collectionByMonth: Array<{ label: string; due: number; paid: number; rate: number }>;
    byCollector: Array<{ collector: string; amount: number }>;
    byFloor: Array<{ floor: number; due: number; paid: number; rate: number }>;
    voluntaryStats: {
      participatingHouseholds: number;
      totalHouseholds: number;
      participationRate: number;
      totalAmount: number;
      averageContribution: number;
    };
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; action: string; entity: string; detail: string; createdAt: string; actor: { fullName: string } }>>([]);

  const [selectedObligationId, setSelectedObligationId] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState("100000");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [collectorName, setCollectorName] = useState("Nguyễn Thu Hà");
  const [paymentNote, setPaymentNote] = useState("Thu theo thông báo kỳ");
  const [payerName, setPayerName] = useState("Người nộp");
  const [payerPhone, setPayerPhone] = useState("0900.000.000");
  const [bankTxRef, setBankTxRef] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [reversalNote, setReversalNote] = useState("");

  const [newApartmentNo, setNewApartmentNo] = useState("D-1501");
  const [newFloorNo, setNewFloorNo] = useState("15");
  const [newOwnerName, setNewOwnerName] = useState("Nguyễn Văn Bình");
  const [newOwnerPhone, setNewOwnerPhone] = useState("0903.777.501");
  const [newEmergencyName, setNewEmergencyName] = useState("Nguyễn Thị Hoa");
  const [newEmergencyPhone, setNewEmergencyPhone] = useState("0907.123.555");
  const [newParkingSlots, setNewParkingSlots] = useState("1");
  const [newMoveInDate, setNewMoveInDate] = useState("2025-02-01");
  const [newOwnershipStatus, setNewOwnershipStatus] = useState<"OWNER" | "TENANT">("OWNER");
  const [newContractEndDate, setNewContractEndDate] = useState("2027-02-01");
  const [newAreaM2, setNewAreaM2] = useState("74");

  const [newResidentName, setNewResidentName] = useState("Phạm Thị Lan");
  const [newResidentHouseholdId, setNewResidentHouseholdId] = useState<number>(1);
  const [newResidentType, setNewResidentType] = useState<"PERMANENT" | "TEMPORARY">("PERMANENT");
  const [newResidentDob, setNewResidentDob] = useState("1995-04-12");
  const [newResidentGender, setNewResidentGender] = useState<"MALE" | "FEMALE" | "OTHER">("FEMALE");
  const [newResidentIdNo, setNewResidentIdNo] = useState("012345679999");

  const [newFeeCode, setNewFeeCode] = useState("VOLUNTARY_SOCIAL");
  const [newFeeName, setNewFeeName] = useState("Quỹ xã hội");
  const [newFeeCategory, setNewFeeCategory] = useState<"MANDATORY" | "VOLUNTARY">("VOLUNTARY");
  const [newFeeMethod, setNewFeeMethod] = useState<"PER_M2" | "FIXED">("FIXED");
  const [newFeeRate, setNewFeeRate] = useState("50000");
  const [newFeeGraceDays, setNewFeeGraceDays] = useState("0");
  const [newFeeLateRule, setNewFeeLateRule] = useState("");
  const [newFeeEffectiveFrom, setNewFeeEffectiveFrom] = useState("2026-01-01");
  const [newFeeEffectiveTo, setNewFeeEffectiveTo] = useState("");
  const [newFeePolicyNote, setNewFeePolicyNote] = useState("");

  const [newPeriodFeeTypeId, setNewPeriodFeeTypeId] = useState<number>(1);
  const [newPeriodMonth, setNewPeriodMonth] = useState("5");
  const [newPeriodYear, setNewPeriodYear] = useState("2026");
  const [newPeriodStatus, setNewPeriodStatus] = useState<"OPEN" | "CLOSED">("OPEN");

  const [eventResidentId, setEventResidentId] = useState<number>(1);
  const [eventType, setEventType] = useState<"TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT">("TEMP_RESIDENCE");
  const [eventFromDate, setEventFromDate] = useState("2026-04-01");
  const [eventToDate, setEventToDate] = useState("2026-04-15");
  const [eventNote, setEventNote] = useState("Cập nhật biến động cư trú");

  const [newUserUsername, setNewUserUsername] = useState("ketoan02");
  const [newUserEmail, setNewUserEmail] = useState("ketoan02@bluemoon.vn");
  const [newUserPhone, setNewUserPhone] = useState("0912.000.010");
  const [newUserFullName, setNewUserFullName] = useState("Nguyễn Thị Thu");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "ACCOUNTANT" | "TEAM_LEADER">("ACCOUNTANT");
  const [newUserPassword, setNewUserPassword] = useState("Bm@2026!");
  const [resetPasswordValue, setResetPasswordValue] = useState("12345678");
  const [editingHouseholdId, setEditingHouseholdId] = useState<number | null>(null);
  const [editingResidentId, setEditingResidentId] = useState<number | null>(null);
  const [editingFeeTypeId, setEditingFeeTypeId] = useState<number | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [selectedResidentIds, setSelectedResidentIds] = useState<number[]>([]);
  const [selectedFeeTypeIds, setSelectedFeeTypeIds] = useState<number[]>([]);
  const [newRoleCode, setNewRoleCode] = useState("TEAM_SUPPORT");
  const [newRoleName, setNewRoleName] = useState("Team support");
  const [newPermCode, setNewPermCode] = useState("REPORT_EXPORT");
  const [newPermName, setNewPermName] = useState("Report export");
  const [newPermModule, setNewPermModule] = useState("REPORT");
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedRolePermissionIds, setSelectedRolePermissionIds] = useState<number[]>([]);
  const [selectedUserIdForRoles, setSelectedUserIdForRoles] = useState<number>(0);
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState<number[]>([]);

  const [pageHouseholds, setPageHouseholds] = useState(1);
  const [pageResidents, setPageResidents] = useState(1);
  const [pagePayments, setPagePayments] = useState(1);
  const pageSize = 10;
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPasswordSelf, setNewPasswordSelf] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const [filterResidentGender, setFilterResidentGender] = useState<"all" | "MALE" | "FEMALE" | "OTHER">("all");
  const [filterResidentType, setFilterResidentType] = useState<"all" | "PERMANENT" | "TEMPORARY">("all");
  const [filterResidentFloor, setFilterResidentFloor] = useState<number | "all">("all");
  const [filterPaymentCollector, setFilterPaymentCollector] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<"all" | "CASH" | "BANK">("all");
  const [filterPaymentFromDate, setFilterPaymentFromDate] = useState("");
  const [filterPaymentToDate, setFilterPaymentToDate] = useState("");

  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterType] = useState<"all" | "MANDATORY" | "VOLUNTARY">("all");
  const [showPaymentColumns, setShowPaymentColumns] = useState<Record<string, boolean>>({
    receipt: true,
    period: true,
    fee: true,
    amount: true,
    method: true,
    collector: true,
    payer: true,
    txRef: true,
  });

  const labels: Record<Tab, string> = {
    dashboard: t(lang, "dashboard"),
    fees: t(lang, "feeTypes"),
    periods: t(lang, "periods"),
    obligations: t(lang, "obligations"),
    households: t(lang, "households"),
    residents: t(lang, "residents"),
    events: t(lang, "residencyEvents"),
    users: t(lang, "users"),
    reports: t(lang, "reports"),
    account: l(lang, "Tài khoản", "Account"),
    handbook: l(lang, "Hướng dẫn", "Handbook"),
  };

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const isAnyBusy = Object.values(busy).some(Boolean);

  async function runAction(key: string, action: () => Promise<void>, successMsg: string, fallbackErr: string) {
    setBusy((p) => ({ ...p, [key]: true }));
    try {
      await action();
      notify("success", successMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : fallbackErr;
      notify("error", msg);
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  }

  const visibleTabs = useMemo(() => {
    if (!user) return ["handbook"] as Tab[];
    const tabs: Tab[] = ["dashboard", "account"];
    if (canPermission(user, "FEE", "READ")) tabs.push("fees", "periods", "obligations");
    if (canPermission(user, "RESIDENT", "READ")) tabs.push("households", "residents", "events");
    if (canPermission(user, "SYSTEM", "ADMIN")) tabs.push("users");
    if (canPermission(user, "REPORT", "READ")) tabs.push("reports");
    tabs.push("handbook");
    return tabs;
  }, [user]);

  const refreshAllFromApi = useCallback(async () => {
    setLoading(true);
    setErrorText("");
    try {
      const [u, h, r, f, p, o, pay, ev, comm, an, roleRows, permRows] = await Promise.all([
        apiGet<User[]>(`${API_BASE}/users?page=1&pageSize=500`).catch(() => []),
        apiGet<Household[]>(`${API_BASE}/households?page=1&pageSize=500`),
        apiGet<Resident[]>(`${API_BASE}/residents?page=1&pageSize=500`),
        apiGet<FeeType[]>(`${API_BASE}/fee-types?page=1&pageSize=500`),
        apiGet<FeePeriod[]>(`${API_BASE}/periods?page=1&pageSize=500`),
        apiGet<Obligation[]>(`${API_BASE}/obligations?page=1&pageSize=500`),
        apiGet<Payment[]>(`${API_BASE}/payments?page=1&pageSize=500`),
        apiGet<ResidencyEvent[]>(`${API_BASE}/residency-events?page=1&pageSize=500`),
        apiGet<Array<CommunicationLog & { household?: Household }>>(`${API_BASE}/communication-logs?page=1&pageSize=200`),
        apiGet<{ aging: Array<{ label: string; count: number; amount: number }>; collectionByMonth: Array<{ label: string; due: number; paid: number; rate: number }>; byCollector: Array<{ collector: string; amount: number }>; byFloor: Array<{ floor: number; due: number; paid: number; rate: number }>; voluntaryStats: { participatingHouseholds: number; totalHouseholds: number; participationRate: number; totalAmount: number; averageContribution: number } }>(`${API_BASE}/reports/analytics`),
        apiGet<AppRole[]>(`${API_BASE}/roles`).catch(() => []),
        apiGet<PermissionItem[]>(`${API_BASE}/permissions`).catch(() => []),
      ]);

      setUsers(u);
      setHouseholds(h);
      setResidents(r);
      setFeeTypes(f);
      setPeriods(p);
      setObligations(o);
      setPayments(pay);
      setEvents(ev);
      setCommunications(comm);
      setAnalytics(an);
      setRoles(roleRows);
      setPermissionItems(permRows);
      if (o.length > 0 && !selectedObligationId) setSelectedObligationId(o[0].id);
      if (h.length > 0) setNewResidentHouseholdId(h[0].id);
      if (r.length > 0) setEventResidentId(r[0].id);
      if (f.length > 0) setNewPeriodFeeTypeId(f[0].id);
      if (roleRows.length > 0 && !selectedRoleId) setSelectedRoleId(roleRows[0].id);
      if (u.length > 0 && !selectedUserIdForRoles) setSelectedUserIdForRoles(u[0].id);
    } catch {
      setErrorText(l(lang, "Không thể tải dữ liệu", "Cannot load data"));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedObligationId, selectedRoleId, selectedUserIdForRoles]);

  const refreshAuditLogs = useCallback(async () => {
    try {
      const logs = await apiGet<Array<{ id: number; action: string; entity: string; detail: string; createdAt: string; actor: { fullName: string } }>>(`${API_BASE}/audit-logs?page=1&pageSize=100`);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    }
  }, []);

  useEffect(() => {
    void apiGet<{ user: User | null }>("/api/auth/me")
      .then((res) => {
        setUser(res.user);
        setProfileFullName(res.user?.fullName ?? "");
        setProfileEmail(res.user?.email ?? "");
        setProfilePhone(res.user?.phone ?? "");
        if (res.user) {
          void refreshAllFromApi();
          void refreshAuditLogs();
        }
      })
      .catch(() => setUser(null));
  }, [refreshAllFromApi, refreshAuditLogs]);

  const searchToken = globalSearch.trim().toLowerCase();
  const filteredHouseholds = useMemo(() => households.filter((h) => `${h.apartmentNo} ${h.ownerName} ${h.ownerPhone}`.toLowerCase().includes(searchToken)), [households, searchToken]);
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (!`${r.fullName} ${r.idNo}`.toLowerCase().includes(searchToken)) return false;
      if (filterResidentGender !== "all" && r.gender !== filterResidentGender) return false;
      if (filterResidentType !== "all" && r.residentType !== filterResidentType) return false;
      if (filterResidentFloor !== "all") {
        const household = households.find((h) => h.id === r.householdId);
        if (!household || household.floorNo !== filterResidentFloor) return false;
      }
      return true;
    });
  }, [residents, searchToken, filterResidentGender, filterResidentType, filterResidentFloor, households]);
  const pagedHouseholds = useMemo(() => filteredHouseholds.slice((pageHouseholds - 1) * pageSize, pageHouseholds * pageSize), [filteredHouseholds, pageHouseholds]);
  const pagedResidents = useMemo(() => filteredResidents.slice((pageResidents - 1) * pageSize, pageResidents * pageSize), [filteredResidents, pageResidents]);
  const paymentView = useMemo(() => {
    return payments.filter((p) => {
      const obligation = obligations.find((o) => o.id === p.obligationId);
      if (!obligation) return false;
      const period = periods.find((x) => x.id === obligation.periodId);
      const feeType = feeTypes.find((x) => x.id === p.feeTypeId);
      if (!period || !feeType) return false;
      if (filterMonth !== "all" && period.month !== filterMonth) return false;
      if (filterYear !== "all" && period.year !== filterYear) return false;
      if (filterType !== "all" && feeType.category !== filterType) return false;
      if (selectedMonthDrilldown) {
        const key = `${period.year}-${String(period.month).padStart(2, "0")}`;
        if (key !== selectedMonthDrilldown) return false;
      }
      if (filterPaymentMethod !== "all" && p.method !== filterPaymentMethod) return false;
      if (filterPaymentCollector && !p.collectorName.toLowerCase().includes(filterPaymentCollector.toLowerCase())) return false;
      if (filterPaymentFromDate) {
        const from = new Date(filterPaymentFromDate);
        if (new Date(p.paidAt) < from) return false;
      }
      if (filterPaymentToDate) {
        const to = new Date(filterPaymentToDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(p.paidAt) > to) return false;
      }
      if (!searchToken) return true;
      return `${p.receiptNo} ${p.collectorName} ${p.payerName ?? ""} ${p.bankTxRef ?? ""}`.toLowerCase().includes(searchToken);
    });
  }, [payments, obligations, periods, feeTypes, filterMonth, filterYear, filterType, selectedMonthDrilldown, filterPaymentMethod, filterPaymentCollector, filterPaymentFromDate, filterPaymentToDate, searchToken]);
  const pagedPayments = useMemo(() => paymentView.slice((pagePayments - 1) * pageSize, pagePayments * pageSize), [paymentView, pagePayments]);

  const selectedObligation = obligations.find((o) => o.id === selectedObligationId) ?? obligations[0];
  const stats = useMemo(() => {
    const totalDue = obligations.reduce((s, o) => s + o.amountDue, 0);
    const totalPaid = obligations.reduce((s, o) => s + o.amountPaid, 0);
    const outstanding = totalDue - totalPaid;
    const paidHouseholds = new Set(obligations.filter((o) => o.amountPaid >= o.amountDue).map((o) => o.householdId)).size;
    return { totalDue, totalPaid, outstanding, paidHouseholds };
  }, [obligations]);

  const monthlyChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of paymentView) {
      const o = obligations.find((x) => x.id === p.obligationId);
      const period = periods.find((x) => x.id === o?.periodId);
      if (!period) continue;
      const key = `${period.year}-${String(period.month).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + p.paidAmount);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
  }, [paymentView, obligations, periods]);

  const typeChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of paymentView) {
      const ft = feeTypes.find((x) => x.id === p.feeTypeId);
      if (!ft) continue;
      map.set(ft.name, (map.get(ft.name) ?? 0) + p.paidAmount);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [paymentView, feeTypes]);

  const years = Array.from(new Set(periods.map((p) => p.year))).sort();

  function login(formData: FormData) {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    void apiPost<{ ok: boolean; user: User }>("/api/auth/login", { usernameOrEmail: username, password })
      .then(async (res) => {
        setLoginError("");
        setUser(res.user);
        await refreshAllFromApi();
        await refreshAuditLogs();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : t(lang, "loginFailed");
        setLoginError(msg);
      });
  }

  function signup() {
    if (!signupUsername || !signupEmail || !signupPhone || !signupFullName || !signupPassword) {
      setLoginError(l(lang, "Vui lòng nhập đủ thông tin đăng ký", "Please complete all signup fields"));
      return;
    }
    void apiPost<{ ok: boolean; userId: number }>("/api/auth/signup", {
      username: signupUsername,
      email: signupEmail,
      phone: signupPhone,
      fullName: signupFullName,
      password: signupPassword,
    })
      .then(() => {
        setAuthMode("login");
        setSignupUsername("");
        setSignupEmail("");
        setSignupPhone("");
        setSignupFullName("");
        setSignupPassword("");
        setLoginError(l(lang, "Đăng ký admin thành công. Hãy đăng nhập.", "Admin signup successful. Please log in."));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : l(lang, "Đăng ký thất bại", "Signup failed");
        setLoginError(msg);
      });
  }

  function logout() {
    void apiPost("/api/auth/logout", {}).finally(() => {
      setUser(null);
      setUsers([]);
      setHouseholds([]);
      setResidents([]);
      setFeeTypes([]);
      setPeriods([]);
      setObligations([]);
      setPayments([]);
      setEvents([]);
      setCommunications([]);
      setAnalytics(null);
      setAuditLogs([]);
    });
  }

  function changePasswordSelf() {
    if (!oldPassword || !newPasswordSelf) return;
    void apiPost(`${API_BASE}/profile/change-password`, { oldPassword, newPassword: newPasswordSelf }).then(() => {
      setOldPassword("");
      setNewPasswordSelf("");
    });
  }

  function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    void fetch(`${API_BASE}/profile/avatar`, {
      method: "POST",
      body: fd,
    })
      .then(async (r) => {
        const data = (await r.json()) as { avatarUrl?: string; message?: string; code?: string };
        if (!r.ok) {
          throw new Error(data.message || data.code || l(lang, "Tải ảnh thất bại", "Avatar upload failed"));
        }
        return data;
      })
      .then((res) => {
        if (res.avatarUrl) {
          setUser((prev) => (prev ? { ...prev, avatarUrl: res.avatarUrl } : prev));
          setErrorText(l(lang, "Tải ảnh đại diện thành công", "Avatar uploaded successfully"));
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : l(lang, "Tải ảnh thất bại", "Avatar upload failed");
        setErrorText(msg);
      });
  }

  function createUser() {
    if (!newUserUsername || !newUserEmail || !newUserPhone || !newUserFullName || !newUserPassword) return;
    void apiPost(`${API_BASE}/users`, {
      username: newUserUsername,
      email: newUserEmail,
      phone: newUserPhone,
      fullName: newUserFullName,
      role: newUserRole,
      password: newUserPassword,
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function createRole() {
    if (!newRoleCode || !newRoleName) return;
    void apiPost(`${API_BASE}/roles`, { code: newRoleCode, name: newRoleName }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function createPermission() {
    if (!newPermCode || !newPermName || !newPermModule) return;
    void apiPost(`${API_BASE}/permissions`, { code: newPermCode, name: newPermName, module: newPermModule }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function saveRolePermissions() {
    if (!selectedRoleId) return;
    void fetch(`${API_BASE}/roles/${selectedRoleId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds: selectedRolePermissionIds }),
    }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function saveUserRoles() {
    if (!selectedUserIdForRoles) return;
    void fetch(`${API_BASE}/users/${selectedUserIdForRoles}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleIds: selectedUserRoleIds }),
    }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function toggleRolePermission(id: number) {
    setSelectedRolePermissionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleUserRole(id: number) {
    setSelectedUserRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addHousehold() {
    const floor = Number(newFloorNo);
    const area = Number(newAreaM2);
    const parkingSlots = Number(newParkingSlots);
    if (!newApartmentNo.trim() || !Number.isFinite(floor) || !newOwnerName.trim() || !newOwnerPhone.trim() || !Number.isFinite(area) || area <= 0) return;
    void apiPost(`${API_BASE}/households`, {
      apartmentNo: newApartmentNo.trim(),
      floorNo: floor,
      ownerName: newOwnerName.trim(),
      ownerPhone: newOwnerPhone.trim(),
      emergencyContactName: newEmergencyName.trim(),
      emergencyContactPhone: newEmergencyPhone.trim(),
      parkingSlots,
      moveInDate: newMoveInDate || undefined,
      ownershipStatus: newOwnershipStatus,
      contractEndDate: newContractEndDate || undefined,
      areaM2: area,
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function saveHouseholdEdit() {
    if (!editingHouseholdId) return;
    const floor = Number(newFloorNo);
    const area = Number(newAreaM2);
    const parkingSlots = Number(newParkingSlots);
    void fetch(`${API_BASE}/households/${editingHouseholdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apartmentNo: newApartmentNo.trim(),
        floorNo: floor,
        ownerName: newOwnerName.trim(),
        ownerPhone: newOwnerPhone.trim(),
        emergencyContactName: newEmergencyName.trim(),
        emergencyContactPhone: newEmergencyPhone.trim(),
        parkingSlots,
        moveInDate: newMoveInDate || null,
        ownershipStatus: newOwnershipStatus,
        contractEndDate: newContractEndDate || null,
        areaM2: area,
      }),
    }).then(async () => {
      setEditingHouseholdId(null);
      await refreshAllFromApi();
    });
  }

  function deleteHousehold(id: number) {
    if (!window.confirm(l(lang, "Bạn có chắc muốn xóa hộ khẩu này?", "Are you sure to delete this household?"))) return;
    void runAction(
      `delete-household-${id}`,
      async () => {
        const res = await fetch(`${API_BASE}/households/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
        await refreshAllFromApi();
      },
      l(lang, "Đã xóa hộ khẩu", "Household deleted"),
      l(lang, "Xóa hộ khẩu thất bại", "Failed to delete household"),
    );
  }

  function addFeeType() {
    const rate = Number(newFeeRate);
    const graceDays = Number(newFeeGraceDays);
    if (!newFeeCode.trim() || !newFeeName.trim() || !Number.isFinite(rate) || rate <= 0) return;
    void apiPost(`${API_BASE}/fee-types`, {
      code: newFeeCode.trim().toUpperCase(),
      name: newFeeName.trim(),
      category: newFeeCategory,
      calcMethod: newFeeMethod,
      rate,
      graceDays,
      lateFeeRule: newFeeLateRule,
      effectiveFrom: newFeeEffectiveFrom || undefined,
      effectiveTo: newFeeEffectiveTo || undefined,
      policyNote: newFeePolicyNote,
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function saveFeeTypeEdit() {
    if (!editingFeeTypeId) return;
    const rate = Number(newFeeRate);
    const graceDays = Number(newFeeGraceDays);
    void fetch(`${API_BASE}/fee-types/${editingFeeTypeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newFeeCode.trim().toUpperCase(),
        name: newFeeName.trim(),
        category: newFeeCategory,
        calcMethod: newFeeMethod,
        rate,
        graceDays,
        lateFeeRule: newFeeLateRule,
        effectiveFrom: newFeeEffectiveFrom || null,
        effectiveTo: newFeeEffectiveTo || null,
        policyNote: newFeePolicyNote,
      }),
    }).then(async () => {
      setEditingFeeTypeId(null);
      await refreshAllFromApi();
    });
  }

  function deleteFeeType(id: number) {
    if (!window.confirm(l(lang, "Bạn có chắc muốn xóa khoản phí này?", "Are you sure to delete this fee type?"))) return;
    void runAction(
      `delete-fee-${id}`,
      async () => {
        const res = await fetch(`${API_BASE}/fee-types/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
        await refreshAllFromApi();
      },
      l(lang, "Đã xóa khoản phí", "Fee type deleted"),
      l(lang, "Xóa khoản phí thất bại", "Failed to delete fee type"),
    );
  }

  function toggleFeeTypeSelection(id: number) {
    setSelectedFeeTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function bulkDeleteFeeTypes() {
    if (selectedFeeTypeIds.length === 0) return;
    if (!window.confirm(l(lang, `Xóa ${selectedFeeTypeIds.length} khoản phí đã chọn?`, `Delete ${selectedFeeTypeIds.length} selected fee types?`))) return;

    const failed: number[] = [];
    for (const id of selectedFeeTypeIds) {
      const res = await fetch(`${API_BASE}/fee-types/${id}`, { method: "DELETE" });
      if (!res.ok) failed.push(id);
    }
    setSelectedFeeTypeIds([]);
    await refreshAllFromApi();
    if (failed.length > 0) {
      notify("error", l(lang, `Không thể xóa ${failed.length} khoản phí do đã phát sinh kỳ thu/giao dịch`, `Failed to delete ${failed.length} fee types due to related periods/payments`));
    } else {
      notify("success", l(lang, "Đã xóa hàng loạt khoản phí", "Bulk fee delete completed"));
    }
  }

  function addResident() {
    if (!newResidentName.trim()) return;
    void apiPost(`${API_BASE}/residents`, {
      householdId: newResidentHouseholdId,
      fullName: newResidentName.trim(),
      dob: newResidentDob,
      gender: newResidentGender,
      idNo: newResidentIdNo,
      residentType: newResidentType,
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function saveResidentEdit() {
    if (!editingResidentId) return;
    void fetch(`${API_BASE}/residents/${editingResidentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId: newResidentHouseholdId,
        fullName: newResidentName.trim(),
        dob: newResidentDob,
        gender: newResidentGender,
        idNo: newResidentIdNo,
        residentType: newResidentType,
      }),
    }).then(async () => {
      setEditingResidentId(null);
      await refreshAllFromApi();
    });
  }

  function deleteResident(id: number) {
    if (!window.confirm(l(lang, "Bạn có chắc muốn xóa nhân khẩu này?", "Are you sure to delete this resident?"))) return;
    void runAction(
      `delete-resident-${id}`,
      async () => {
        const res = await fetch(`${API_BASE}/residents/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
        await refreshAllFromApi();
      },
      l(lang, "Đã xóa nhân khẩu", "Resident deleted"),
      l(lang, "Xóa nhân khẩu thất bại", "Failed to delete resident"),
    );
  }

  function toggleResidentSelection(id: number) {
    setSelectedResidentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function bulkDeleteResidents() {
    if (selectedResidentIds.length === 0) return;
    if (!window.confirm(l(lang, `Xóa ${selectedResidentIds.length} nhân khẩu đã chọn?`, `Delete ${selectedResidentIds.length} selected residents?`))) return;

    const failed: number[] = [];
    for (const id of selectedResidentIds) {
      const res = await fetch(`${API_BASE}/residents/${id}`, { method: "DELETE" });
      if (!res.ok) failed.push(id);
    }
    setSelectedResidentIds([]);
    await refreshAllFromApi();
    if (failed.length > 0) {
      notify("error", l(lang, `Không thể xóa ${failed.length} nhân khẩu do ràng buộc dữ liệu`, `Failed to delete ${failed.length} residents due to dependencies`));
    } else {
      notify("success", l(lang, "Đã xóa hàng loạt nhân khẩu", "Bulk resident delete completed"));
    }
  }

  function addCommunicationLog(householdId: number) {
    void apiPost(`${API_BASE}/communication-logs`, {
      householdId,
      channel: "SMS",
      status: "SENT",
      note: l(lang, "Nhắc đóng phí tự động", "Automated payment reminder"),
    }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function addPeriod() {
    const month = Number(newPeriodMonth);
    const year = Number(newPeriodYear);
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    if (!Number.isInteger(year) || year < 2000) return;
    void apiPost(`${API_BASE}/periods`, { feeTypeId: newPeriodFeeTypeId, month, year }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function savePeriodEdit() {
    if (!editingPeriodId) return;
    const month = Number(newPeriodMonth);
    const year = Number(newPeriodYear);
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    if (!Number.isInteger(year) || year < 2000) return;
    void fetch(`${API_BASE}/periods/${editingPeriodId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feeTypeId: newPeriodFeeTypeId,
        month,
        year,
        status: newPeriodStatus,
      }),
    }).then(async () => {
      setEditingPeriodId(null);
      await refreshAllFromApi();
    });
  }

  function deletePeriod(id: number) {
    if (!window.confirm(l(lang, "Bạn có chắc muốn xóa kỳ thu này?", "Are you sure to delete this period?"))) return;
    void runAction(
      `delete-period-${id}`,
      async () => {
        const res = await fetch(`${API_BASE}/periods/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
        await refreshAllFromApi();
      },
      l(lang, "Đã xóa kỳ thu", "Period deleted"),
      l(lang, "Xóa kỳ thu thất bại", "Failed to delete period"),
    );
  }

  function collectPayment() {
    if (!selectedObligation) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    void apiPost(`${API_BASE}/payments`, {
      obligationId: selectedObligation.id,
      paidAmount: amount,
      method: paymentMethod,
      collectorName,
      note: paymentNote,
      payerName,
      payerPhone,
      bankTxRef,
      attachmentUrl,
      reversalNote,
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function savePaymentEdit() {
    if (!editingPaymentId) return;
    void fetch(`${API_BASE}/payments/${editingPaymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: paymentMethod,
        collectorName,
        payerName,
        payerPhone,
        bankTxRef,
        attachmentUrl,
        reversalNote,
        note: paymentNote,
      }),
    }).then(async () => {
      setEditingPaymentId(null);
      await refreshAllFromApi();
    });
  }

  function deletePayment(id: number) {
    if (!window.confirm(l(lang, "Bạn có chắc muốn xóa giao dịch này?", "Are you sure to delete this payment?"))) return;
    void runAction(
      `delete-payment-${id}`,
      async () => {
        const res = await fetch(`${API_BASE}/payments/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
        await refreshAllFromApi();
      },
      l(lang, "Đã xóa giao dịch", "Payment deleted"),
      l(lang, "Xóa giao dịch thất bại", "Failed to delete payment"),
    );
  }

  function saveResidencyEvent() {
    if (!eventResidentId || !eventFromDate) return;
    void apiPost(`${API_BASE}/residency-events`, {
      residentId: eventResidentId,
      eventType,
      fromDate: eventFromDate,
      toDate: eventToDate,
      note: eventNote,
      createdBy: user?.fullName ?? "System",
    }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function updateResidencyEvent(eventId: number) {
    void fetch(`${API_BASE}/residency-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: `${eventNote} (${l(lang, "đã cập nhật", "updated")})` }),
    }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function removeResidencyEvent(eventId: number) {
    void fetch(`${API_BASE}/residency-events/${eventId}`, {
      method: "DELETE",
    }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function downloadPaymentsCsv() {
    const params = new URLSearchParams();
    if (filterMonth !== "all") params.set("month", String(filterMonth));
    if (filterYear !== "all") params.set("year", String(filterYear));
    window.open(`${API_BASE}/reports/payments?${params.toString()}`, "_blank");
  }

  function downloadPaymentsPdf() {
    const params = new URLSearchParams();
    params.set("format", "pdf");
    if (filterMonth !== "all") params.set("month", String(filterMonth));
    if (filterYear !== "all") params.set("year", String(filterYear));
    window.open(`${API_BASE}/reports/payments?${params.toString()}`, "_blank");
  }

  function downloadResidencyCsv() {
    window.open(`${API_BASE}/reports/residency`, "_blank");
  }

  function downloadResidencyPdf() {
    window.open(`${API_BASE}/reports/residency?format=pdf`, "_blank");
  }

  function downloadDebtSummaryCsv(householdId?: number) {
    const params = new URLSearchParams();
    if (householdId) params.set("householdId", String(householdId));
    window.open(`${API_BASE}/reports/debt-summary?${params.toString()}`, "_blank");
  }

  function downloadDebtSummaryPdf(householdId?: number) {
    const params = new URLSearchParams();
    params.set("format", "pdf");
    if (householdId) params.set("householdId", String(householdId));
    window.open(`${API_BASE}/reports/debt-summary?${params.toString()}`, "_blank");
  }

  function printPaymentReceipt(paymentId: number) {
    window.open(`${API_BASE}/payments/${paymentId}/receipt`, "_blank");
  }

  if (!user) {
    return (
      <AuthCard
        lang={lang}
        onChangeLang={setLang}
        loginError={loginError}
        authMode={authMode}
        setAuthMode={setAuthMode}
        signupUsername={signupUsername}
        setSignupUsername={setSignupUsername}
        signupEmail={signupEmail}
        setSignupEmail={setSignupEmail}
        signupPhone={signupPhone}
        setSignupPhone={setSignupPhone}
        signupFullName={signupFullName}
        setSignupFullName={setSignupFullName}
        signupPassword={signupPassword}
        setSignupPassword={setSignupPassword}
        onSignup={signup}
        onLogin={login}
        l={l}
      />
    );
  }

  return (
    <main className="page-shell">
      <header className="header-band">
        <div>
          <p className="eyebrow">{t(lang, "projectName")}</p>
          <h1 className="title">{t(lang, "appTitle")}</h1>
          <p className="muted">{l(lang, "Bản mở rộng cho đồ án: dữ liệu sâu + analytics + UX", "School-project expansion: richer data + analytics + UX")}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitch lang={lang} onChange={setLang} label={t(lang, "language")} />
          <button className="btn-ghost" onClick={logout}>{t(lang, "logout")} ({user.username})</button>
        </div>
      </header>

      <section className="layout-main">
        <Sidebar tab={tab} onTab={setTab} labels={labels} title={t(lang, "nav")} visibleTabs={visibleTabs} />

        <div className="space-y-4">
          {toast && (
            <section className={`card ${toast.type === "success" ? "border-[#b7e4c7]" : "border-[#f4b6b6]"}`}>
              <p className={toast.type === "success" ? "text-[#1f7a3f]" : "text-[#b42318]"}>{toast.message}</p>
            </section>
          )}

          <section className="card">
            {isAnyBusy && <p className="muted mb-2">{l(lang, "Đang xử lý thao tác...", "Processing action...")}</p>}
            <div className="grid gap-2 md:grid-cols-3 items-end">
              <div>
                <label className="label">{l(lang, "Tìm kiếm toàn cục", "Global search")}</label>
                <input className="input" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder={l(lang, "Căn hộ, cư dân, phiếu thu, người thu...", "Apartment, resident, receipt, collector...")} />
              </div>
              <div>
                <label className="label">{t(lang, "filterMonth")}</label>
                <select className="input" value={String(filterMonth)} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}>
                  <option value="all">{t(lang, "all")}</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t(lang, "filterYear")}</label>
                <select className="input" value={String(filterYear)} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}>
                  <option value="all">{t(lang, "all")}</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {loading && <p className="muted mt-2">{t(lang, "loading")}</p>}
            {errorText && <p className="error-text mt-2">{errorText}</p>}
          </section>

          {tab === "dashboard" && (
            <>
              <section className="stats-grid">
                <article className="card"><p className="muted">{t(lang, "totalDue")}</p><p className="value">{formatVnd(stats.totalDue)}</p></article>
                <article className="card"><p className="muted">{t(lang, "totalPaid")}</p><p className="value">{formatVnd(stats.totalPaid)}</p></article>
                <article className="card"><p className="muted">{t(lang, "outstanding")}</p><p className="value">{formatVnd(stats.outstanding)}</p></article>
                <article className="card"><p className="muted">{t(lang, "paidHouseholds")}</p><p className="value">{stats.paidHouseholds}/{households.length}</p></article>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <BarChart title={t(lang, "chartByMonth")} data={monthlyChartData.length ? monthlyChartData : [{ label: t(lang, "noData"), value: 0 }]} color="linear-gradient(90deg,#0f5fdf,#2f86ff)" formatter={formatVnd} maxBars={8} onBarClick={setSelectedMonthDrilldown} selectedLabel={selectedMonthDrilldown} paginationLabels={{ prev: t(lang, "chartPrev"), next: t(lang, "chartNext"), showing: t(lang, "chartShowing") }} />
                <BarChart title={t(lang, "chartByType")} data={typeChartData.length ? typeChartData : [{ label: t(lang, "noData"), value: 0 }]} color="linear-gradient(90deg,#10a3a3,#26c7b0)" formatter={formatVnd} maxBars={8} paginationLabels={{ prev: t(lang, "chartPrev"), next: t(lang, "chartNext"), showing: t(lang, "chartShowing") }} />
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <article className="card">
                  <h3 className="subtitle">{l(lang, "Cần chú ý", "Needs attention")}</h3>
                  <p className="muted mt-2">{l(lang, "Hộ sắp hết hợp đồng (60 ngày)", "Contracts ending within 60 days")}: {households.filter((h) => h.contractEndDate && new Date(h.contractEndDate).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60).length}</p>
                  <p className="muted">{l(lang, "Gửi nhắc phí thất bại", "Failed reminder deliveries")}: {communications.filter((x) => x.status === "FAILED").length}</p>
                </article>
                <article className="card">
                  <h3 className="subtitle">{l(lang, "Thống kê quỹ tự nguyện", "Voluntary funds")}</h3>
                  <p className="muted mt-2">{l(lang, "Tỉ lệ tham gia", "Participation rate")}: {analytics?.voluntaryStats.participationRate ?? 0}%</p>
                  <p className="muted">{l(lang, "Tổng đóng góp", "Total contribution")}: {formatVnd(analytics?.voluntaryStats.totalAmount ?? 0)}</p>
                </article>
                <article className="card">
                  <h3 className="subtitle">{l(lang, "Nợ theo số ngày trễ hạn đóng tiền", "Overdue debt by late-payment days")}</h3>
                  {(analytics?.aging ?? []).map((a) => <p key={a.label} className="muted mt-1">{a.label}: {a.count} | {formatVnd(a.amount)}</p>)}
                </article>
              </section>
            </>
          )}

          {tab === "households" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "households")}</h2>
              <div className="grid gap-2 mt-3 md:grid-cols-4">
                <input className="input" value={newApartmentNo} onChange={(e) => setNewApartmentNo(e.target.value)} placeholder={t(lang, "apartment")} />
                <input className="input" value={newFloorNo} onChange={(e) => setNewFloorNo(e.target.value)} placeholder={t(lang, "floor")} />
                <input className="input" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder={t(lang, "owner")} />
                <input className="input" value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} placeholder={t(lang, "phone")} />
                <input className="input" value={newEmergencyName} onChange={(e) => setNewEmergencyName(e.target.value)} placeholder={l(lang, "Người liên hệ khẩn", "Emergency contact")} />
                <input className="input" value={newEmergencyPhone} onChange={(e) => setNewEmergencyPhone(e.target.value)} placeholder={l(lang, "SĐT khẩn", "Emergency phone")} />
                <input className="input" value={newParkingSlots} onChange={(e) => setNewParkingSlots(e.target.value)} placeholder={l(lang, "Số chỗ xe", "Parking slots")} />
                <input className="input" type="date" value={newMoveInDate} onChange={(e) => setNewMoveInDate(e.target.value)} />
                <select className="input" value={newOwnershipStatus} onChange={(e) => setNewOwnershipStatus(e.target.value as "OWNER" | "TENANT")}>
                  <option value="OWNER">{l(lang, "Chủ sở hữu", "Owner")}</option>
                  <option value="TENANT">{l(lang, "Người thuê", "Tenant")}</option>
                </select>
                <input className="input" type="date" value={newContractEndDate} onChange={(e) => setNewContractEndDate(e.target.value)} />
                <input className="input" value={newAreaM2} onChange={(e) => setNewAreaM2(e.target.value)} placeholder={`${t(lang, "area")} (m2)`} />
                {editingHouseholdId ? (
                  <button className="btn-primary" onClick={saveHouseholdEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button>
                ) : (
                  <button className="btn-primary" onClick={addHousehold}>{t(lang, "addHousehold")}</button>
                )}
              </div>

              <div className="table-wrap mt-3">
                <table>
                  <thead><tr><th>{t(lang, "apartment")}</th><th>{t(lang, "owner")}</th><th>{l(lang, "Sở hữu", "Ownership")}</th><th>{l(lang, "Khẩn cấp", "Emergency")}</th><th>{l(lang, "Xe", "Parking")}</th><th>{l(lang, "Ngày vào", "Move-in")}</th><th>{l(lang, "Nhắc phí", "Remind")}</th></tr></thead>
                  <tbody>
                    {pagedHouseholds.map((h) => (
                      <tr key={h.id}>
                        <td>{h.apartmentNo}</td>
                        <td>{h.ownerName} ({h.ownerPhone})</td>
                        <td><span className={`pill ${h.ownershipStatus === "TENANT" ? "pill-tenant" : "pill-owner"}`}>{h.ownershipStatus === "TENANT" ? l(lang, "Thuê", "Tenant") : l(lang, "Chủ", "Owner")}</span></td>
                        <td>{h.emergencyContactName || "-"} {h.emergencyContactPhone ? `(${h.emergencyContactPhone})` : ""}</td>
                        <td>{h.parkingSlots ?? 0}</td>
                        <td>{h.moveInDate ? new Date(h.moveInDate).toLocaleDateString("vi-VN") : "-"}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn-secondary" onClick={() => addCommunicationLog(h.id)}>{l(lang, "Gửi", "Send")}</button>
                            <button className="btn-secondary" onClick={() => downloadDebtSummaryPdf(h.id)}>{l(lang, "In công nợ", "Print debt")}</button>
                            <button className="btn-secondary" onClick={() => {
                              setEditingHouseholdId(h.id);
                              setNewApartmentNo(h.apartmentNo);
                              setNewFloorNo(String(h.floorNo));
                              setNewOwnerName(h.ownerName);
                              setNewOwnerPhone(h.ownerPhone);
                              setNewEmergencyName(h.emergencyContactName ?? "");
                              setNewEmergencyPhone(h.emergencyContactPhone ?? "");
                              setNewParkingSlots(String(h.parkingSlots ?? 0));
                              setNewMoveInDate(h.moveInDate ? h.moveInDate.slice(0, 10) : "");
                              setNewOwnershipStatus(h.ownershipStatus ?? "OWNER");
                              setNewContractEndDate(h.contractEndDate ? h.contractEndDate.slice(0, 10) : "");
                              setNewAreaM2(String(h.areaM2));
                            }}>{l(lang, "Sửa", "Edit")}</button>
                            <button className="btn-danger" onClick={() => deleteHousehold(h.id)}>{l(lang, "Xóa", "Delete")}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn-secondary" disabled={pageHouseholds <= 1} onClick={() => setPageHouseholds((p) => Math.max(1, p - 1))}>{l(lang, "Trước", "Prev")}</button>
                <button className="btn-secondary" disabled={pageHouseholds * pageSize >= filteredHouseholds.length} onClick={() => setPageHouseholds((p) => p + 1)}>{l(lang, "Sau", "Next")}</button>
              </div>

              <h3 className="subtitle mt-4">{l(lang, "Lịch sử nhắc phí", "Communication logs")}</h3>
              <div className="timeline mt-2">
                {communications.slice(0, 8).map((c) => (
                  <article className="timeline-item" key={c.id}>
                    <div className="timeline-top">
                      <strong>{c.household?.apartmentNo ?? c.householdId}</strong>
                      <span className={`pill ${c.status === "SENT" ? "pill-sent" : c.status === "FAILED" ? "pill-failed" : "pill-pending"}`}>{c.status}</span>
                    </div>
                    <p className="muted mt-1">{c.channel} • {new Date(c.sentAt).toLocaleString("vi-VN")}</p>
                    <p className="muted">{c.note || "-"}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "fees" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "feeTypes")}</h2>
              <div className="grid gap-2 mt-3 md:grid-cols-4">
                <input className="input" placeholder={t(lang, "code")} value={newFeeCode} onChange={(e) => setNewFeeCode(e.target.value)} />
                <input className="input" placeholder={t(lang, "name")} value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)} />
                <select className="input" value={newFeeCategory} onChange={(e) => setNewFeeCategory(e.target.value as "MANDATORY" | "VOLUNTARY")}>
                  <option value="MANDATORY">{t(lang, "mandatory")}</option><option value="VOLUNTARY">{t(lang, "voluntary")}</option>
                </select>
                <select className="input" value={newFeeMethod} onChange={(e) => setNewFeeMethod(e.target.value as "PER_M2" | "FIXED")}>
                  <option value="PER_M2">{t(lang, "perM2")}</option><option value="FIXED">{t(lang, "fixed")}</option>
                </select>
                <input className="input" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} placeholder={t(lang, "rate")} />
                <input className="input" value={newFeeGraceDays} onChange={(e) => setNewFeeGraceDays(e.target.value)} placeholder={l(lang, "Ngày ân hạn", "Grace days")} />
                <input className="input" value={newFeeLateRule} onChange={(e) => setNewFeeLateRule(e.target.value)} placeholder={l(lang, "Quy tắc phạt trễ", "Late fee rule")} />
                <input className="input" value={newFeePolicyNote} onChange={(e) => setNewFeePolicyNote(e.target.value)} placeholder={l(lang, "Ghi chú chính sách", "Policy note")} />
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-3">
                <input className="input" type="date" value={newFeeEffectiveFrom} onChange={(e) => setNewFeeEffectiveFrom(e.target.value)} />
                <input className="input" type="date" value={newFeeEffectiveTo} onChange={(e) => setNewFeeEffectiveTo(e.target.value)} />
                {editingFeeTypeId ? (
                  <button className="btn-primary" onClick={saveFeeTypeEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button>
                ) : (
                  <button className="btn-primary" onClick={addFeeType}>{t(lang, "add")}</button>
                )}
              </div>
              <div className="table-wrap mt-3">
                <table>
                  <thead><tr><th><input type="checkbox" checked={feeTypes.length > 0 && selectedFeeTypeIds.length === feeTypes.length} onChange={(e) => setSelectedFeeTypeIds(e.target.checked ? feeTypes.map((x) => x.id) : [])} /></th><th>{t(lang, "code")}</th><th>{t(lang, "name")}</th><th>{t(lang, "rate")}</th><th>{l(lang, "Ân hạn", "Grace")}</th><th>{l(lang, "Phạt trễ", "Late rule")}</th><th>{l(lang, "Thao tác", "Actions")}</th></tr></thead>
                  <tbody>{feeTypes.map((f) => <tr key={f.id}><td><input type="checkbox" checked={selectedFeeTypeIds.includes(f.id)} onChange={() => toggleFeeTypeSelection(f.id)} /></td><td>{f.code}</td><td>{f.name}</td><td>{formatVnd(f.rate)}</td><td>{f.graceDays ?? 0}</td><td>{f.lateFeeRule || "-"}</td><td><div className="flex gap-2"><button className="btn-secondary" onClick={() => {
                    setEditingFeeTypeId(f.id);
                    setNewFeeCode(f.code);
                    setNewFeeName(f.name);
                    setNewFeeCategory(f.category);
                    setNewFeeMethod(f.calcMethod);
                    setNewFeeRate(String(f.rate));
                    setNewFeeGraceDays(String(f.graceDays ?? 0));
                    setNewFeeLateRule(f.lateFeeRule ?? "");
                    setNewFeeEffectiveFrom(f.effectiveFrom ? f.effectiveFrom.slice(0, 10) : "");
                    setNewFeeEffectiveTo(f.effectiveTo ? f.effectiveTo.slice(0, 10) : "");
                    setNewFeePolicyNote(f.policyNote ?? "");
                  }}>{l(lang, "Sửa", "Edit")}</button><button className="btn-danger" onClick={() => deleteFeeType(f.id)}>{l(lang, "Xóa", "Delete")}</button></div></td></tr>)}</tbody>
                </table>
              </div>
              <button className="btn-danger mt-2" onClick={() => void bulkDeleteFeeTypes()}>{l(lang, "Xóa đã chọn", "Delete selected")}</button>
            </section>
          )}

          {tab === "periods" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "periods")}</h2>
              <div className="grid gap-2 mt-3 md:grid-cols-5">
                <select className="input" value={newPeriodFeeTypeId} onChange={(e) => setNewPeriodFeeTypeId(Number(e.target.value))}>{feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                <input className="input" value={newPeriodMonth} onChange={(e) => setNewPeriodMonth(e.target.value)} />
                <input className="input" value={newPeriodYear} onChange={(e) => setNewPeriodYear(e.target.value)} />
                <select className="input" value={newPeriodStatus} onChange={(e) => setNewPeriodStatus(e.target.value as "OPEN" | "CLOSED")}>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                {editingPeriodId ? (
                  <button className="btn-primary" onClick={savePeriodEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button>
                ) : (
                  <button className="btn-primary" onClick={addPeriod}>{t(lang, "add")}</button>
                )}
              </div>
              <div className="table-wrap mt-3"><table><thead><tr><th>ID</th><th>{t(lang, "name")}</th><th>{t(lang, "month")}</th><th>{t(lang, "year")}</th><th>{t(lang, "status")}</th><th>{l(lang, "Thao tác", "Actions")}</th></tr></thead><tbody>{periods.map((p) => <tr key={p.id}><td>{p.id}</td><td>{feeTypes.find((f) => f.id === p.feeTypeId)?.name}</td><td>{p.month}</td><td>{p.year}</td><td>{p.status}</td><td><div className="flex gap-2"><button className="btn-secondary" onClick={() => {
                setEditingPeriodId(p.id);
                setNewPeriodFeeTypeId(p.feeTypeId);
                setNewPeriodMonth(String(p.month));
                setNewPeriodYear(String(p.year));
                setNewPeriodStatus(p.status);
              }}>{l(lang, "Sửa", "Edit")}</button><button className="btn-danger" onClick={() => deletePeriod(p.id)}>{l(lang, "Xóa", "Delete")}</button></div></td></tr>)}</tbody></table></div>
            </section>
          )}

          {tab === "obligations" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "obligations")}</h2>
              <div className="grid gap-3 md:grid-cols-3 mt-3">
                <select className="input" value={selectedObligationId} onChange={(e) => setSelectedObligationId(Number(e.target.value))}>
                  {obligations.map((o) => {
                    const h = households.find((x) => x.id === o.householdId);
                    const period = periods.find((x) => x.id === o.periodId);
                    const ft = feeTypes.find((x) => x.id === period?.feeTypeId);
                    return <option key={o.id} value={o.id}>{h?.apartmentNo} | {ft?.name} | {formatVnd(o.amountDue - o.amountPaid)}</option>;
                  })}
                </select>
                <input className="input" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "BANK")}><option value="CASH">{t(lang, "paymentMethodCash")}</option><option value="BANK">{t(lang, "paymentMethodBank")}</option></select>
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-3">
                <input className="input" value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder={t(lang, "collector")} />
                <input className="input" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder={l(lang, "Người nộp", "Payer")} />
                <input className="input" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder={l(lang, "SĐT người nộp", "Payer phone")} />
                <input className="input" value={bankTxRef} onChange={(e) => setBankTxRef(e.target.value)} placeholder={l(lang, "Mã GD ngân hàng", "Bank tx ref")} />
                <input className="input" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder={l(lang, "URL chứng từ", "Attachment URL")} />
                <input className="input" value={reversalNote} onChange={(e) => setReversalNote(e.target.value)} placeholder={l(lang, "Ghi chú hoàn tác", "Reversal note")} />
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-4">
                <input className="input" value={filterPaymentCollector} onChange={(e) => setFilterPaymentCollector(e.target.value)} placeholder={l(lang, "Lọc theo người thu", "Filter by collector")} />
                <select className="input" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value as "all" | "CASH" | "BANK")}>
                  <option value="all">{l(lang, "Mọi phương thức", "All methods")}</option>
                  <option value="CASH">{t(lang, "paymentMethodCash")}</option>
                  <option value="BANK">{t(lang, "paymentMethodBank")}</option>
                </select>
                <input className="input" type="date" value={filterPaymentFromDate} onChange={(e) => setFilterPaymentFromDate(e.target.value)} />
                <input className="input" type="date" value={filterPaymentToDate} onChange={(e) => setFilterPaymentToDate(e.target.value)} />
              </div>
              <input className="input mt-2" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder={t(lang, "noteField")} />
              {editingPaymentId ? (
                <button className="btn-primary mt-3" onClick={savePaymentEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button>
              ) : (
                <button className="btn-primary mt-3" onClick={collectPayment}>{t(lang, "collectPayment")}</button>
              )}

              <h3 className="subtitle mt-4">{l(lang, "Dòng thời gian giao dịch", "Payment timeline")}</h3>
              <div className="timeline mt-2">
                {paymentView.slice(0, 8).map((p) => (
                  <article className="timeline-item" key={p.id}>
                    <div className="timeline-top"><strong>{p.receiptNo}</strong><strong>{formatVnd(p.paidAmount)}</strong></div>
                    <p className="muted mt-1">{p.collectorName} • {new Date(p.paidAt).toLocaleString("vi-VN")}</p>
                    <p className="muted">{p.payerName || "-"} {p.bankTxRef ? `• ${p.bankTxRef}` : ""}</p>
                    <div className="flex gap-2 mt-2">
                      <button className="btn-secondary" onClick={() => {
                        setEditingPaymentId(p.id);
                        setPaymentMethod(p.method);
                        setCollectorName(p.collectorName);
                        setPayerName(p.payerName ?? "");
                        setPayerPhone(p.payerPhone ?? "");
                        setBankTxRef(p.bankTxRef ?? "");
                        setAttachmentUrl(p.attachmentUrl ?? "");
                        setReversalNote(p.reversalNote ?? "");
                        setPaymentNote(p.note);
                      }}>{l(lang, "Sửa", "Edit")}</button>
                      <button className="btn-secondary" onClick={() => printPaymentReceipt(p.id)}>{l(lang, "In biên lai", "Print receipt")}</button>
                      <button className="btn-danger" onClick={() => deletePayment(p.id)}>{l(lang, "Xóa", "Delete")}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "residents" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "residents")}</h2>
              <div className="grid gap-2 mt-3 md:grid-cols-7">
                <input className="input" value={newResidentName} onChange={(e) => setNewResidentName(e.target.value)} placeholder={t(lang, "fullName")} />
                <select className="input" value={newResidentHouseholdId} onChange={(e) => setNewResidentHouseholdId(Number(e.target.value))}>{households.map((h) => <option key={h.id} value={h.id}>{h.apartmentNo}</option>)}</select>
                <input className="input" type="date" value={newResidentDob} onChange={(e) => setNewResidentDob(e.target.value)} />
                <select className="input" value={newResidentGender} onChange={(e) => setNewResidentGender(e.target.value as "MALE" | "FEMALE" | "OTHER")}><option value="MALE">{t(lang, "male")}</option><option value="FEMALE">{t(lang, "female")}</option><option value="OTHER">{t(lang, "other")}</option></select>
                <input className="input" value={newResidentIdNo} onChange={(e) => setNewResidentIdNo(e.target.value)} placeholder={t(lang, "idNo")} />
                <select className="input" value={newResidentType} onChange={(e) => setNewResidentType(e.target.value as "PERMANENT" | "TEMPORARY")}><option value="PERMANENT">{t(lang, "residentPermanent")}</option><option value="TEMPORARY">{t(lang, "residentTemporary")}</option></select>
                {editingResidentId ? (
                  <button className="btn-primary" onClick={saveResidentEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button>
                ) : (
                  <button className="btn-primary" onClick={addResident}>{t(lang, "addResident")}</button>
                )}
              </div>
              <div className="table-wrap mt-3"><table><thead><tr><th><input type="checkbox" checked={pagedResidents.length > 0 && pagedResidents.every((x) => selectedResidentIds.includes(x.id))} onChange={(e) => setSelectedResidentIds(e.target.checked ? Array.from(new Set([...selectedResidentIds, ...pagedResidents.map((x) => x.id)])) : selectedResidentIds.filter((id) => !pagedResidents.some((x) => x.id === id)))} /></th><th>{t(lang, "fullName")}</th><th>{t(lang, "apartment")}</th><th>{t(lang, "dob")}</th><th>{t(lang, "idNo")}</th><th>{l(lang, "Thao tác", "Actions")}</th></tr></thead><tbody>{pagedResidents.map((r) => <tr key={r.id}><td><input type="checkbox" checked={selectedResidentIds.includes(r.id)} onChange={() => toggleResidentSelection(r.id)} /></td><td>{r.fullName}</td><td>{households.find((x) => x.id === r.householdId)?.apartmentNo}</td><td>{new Date(r.dob).toLocaleDateString("vi-VN")}</td><td>{r.idNo}</td><td><div className="flex gap-2"><button className="btn-secondary" onClick={() => {
                setEditingResidentId(r.id);
                setNewResidentName(r.fullName);
                setNewResidentHouseholdId(r.householdId);
                setNewResidentDob(r.dob.slice(0, 10));
                setNewResidentGender(r.gender);
                setNewResidentIdNo(r.idNo);
                setNewResidentType(r.residentType);
              }}>{l(lang, "Sửa", "Edit")}</button><button className="btn-danger" onClick={() => deleteResident(r.id)}>{l(lang, "Xóa", "Delete")}</button></div></td></tr>)}</tbody></table></div>
              <div className="flex gap-2 mt-2">
                <button className="btn-secondary" disabled={pageResidents <= 1} onClick={() => setPageResidents((p) => Math.max(1, p - 1))}>{l(lang, "Trước", "Prev")}</button>
                <button className="btn-secondary" disabled={pageResidents * pageSize >= filteredResidents.length} onClick={() => setPageResidents((p) => p + 1)}>{l(lang, "Sau", "Next")}</button>
              </div>
              <button className="btn-danger mt-2" onClick={() => void bulkDeleteResidents()}>{l(lang, "Xóa đã chọn", "Delete selected")}</button>
              <div className="grid gap-2 mt-3 md:grid-cols-4">
                <select className="input" value={filterResidentGender} onChange={(e) => setFilterResidentGender(e.target.value as "all" | "MALE" | "FEMALE" | "OTHER")}>
                  <option value="all">{l(lang, "Mọi giới tính", "All genders")}</option>
                  <option value="MALE">{t(lang, "male")}</option>
                  <option value="FEMALE">{t(lang, "female")}</option>
                  <option value="OTHER">{t(lang, "other")}</option>
                </select>
                <select className="input" value={filterResidentType} onChange={(e) => setFilterResidentType(e.target.value as "all" | "PERMANENT" | "TEMPORARY")}>
                  <option value="all">{l(lang, "Mọi loại cư trú", "All resident types")}</option>
                  <option value="PERMANENT">{t(lang, "residentPermanent")}</option>
                  <option value="TEMPORARY">{t(lang, "residentTemporary")}</option>
                </select>
                <select className="input" value={String(filterResidentFloor)} onChange={(e) => setFilterResidentFloor(e.target.value === "all" ? "all" : Number(e.target.value))}>
                  <option value="all">{l(lang, "Mọi tầng", "All floors")}</option>
                  {Array.from(new Set(households.map((h) => h.floorNo))).sort((a, b) => a - b).map((floor) => <option key={floor} value={floor}>{l(lang, "Tầng", "Floor")} {floor}</option>)}
                </select>
                <button className="btn-secondary" onClick={() => {
                  setFilterResidentGender("all");
                  setFilterResidentType("all");
                  setFilterResidentFloor("all");
                }}>{l(lang, "Xóa lọc cư dân", "Clear resident filters")}</button>
              </div>
            </section>
          )}

          {tab === "events" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "residencyEvents")}</h2>
              <div className="grid gap-2 mt-3 md:grid-cols-6">
                <select className="input" value={eventResidentId} onChange={(e) => setEventResidentId(Number(e.target.value))}>{residents.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}</select>
                <select className="input" value={eventType} onChange={(e) => setEventType(e.target.value as "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT")}><option value="TEMP_RESIDENCE">{t(lang, "tempResidence")}</option><option value="TEMP_ABSENCE">{t(lang, "tempAbsence")}</option><option value="MOVE_IN">{t(lang, "moveIn")}</option><option value="MOVE_OUT">{t(lang, "moveOut")}</option></select>
                <input className="input" type="date" value={eventFromDate} onChange={(e) => setEventFromDate(e.target.value)} />
                <input className="input" type="date" value={eventToDate} onChange={(e) => setEventToDate(e.target.value)} />
                <input className="input" value={eventNote} onChange={(e) => setEventNote(e.target.value)} placeholder={t(lang, "noteField")} />
                <button className="btn-primary" onClick={saveResidencyEvent}>{t(lang, "save")}</button>
              </div>
              <div className="timeline mt-3">
                {events.slice(0, 12).map((ev) => {
                  const r = residents.find((x) => x.id === ev.residentId);
                  return (
                    <article className="timeline-item" key={ev.id}>
                      <div className="timeline-top"><strong>{r?.fullName ?? ev.residentId}</strong><span className="muted">{ev.eventType}</span></div>
                      <p className="muted mt-1">{new Date(ev.fromDate).toLocaleDateString("vi-VN")} - {ev.toDate ? new Date(ev.toDate).toLocaleDateString("vi-VN") : "-"}</p>
                      <p className="muted">{ev.note}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="btn-secondary" onClick={() => updateResidencyEvent(ev.id)}>{l(lang, "Sửa", "Edit")}</button>
                        <button className="btn-danger" onClick={() => removeResidencyEvent(ev.id)}>{l(lang, "Xóa", "Delete")}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {tab === "users" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "users")}</h2>
              {user.role === "ADMIN" && (
                <>
                  <div className="grid gap-2 mt-3 md:grid-cols-6">
                    <input className="input" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} placeholder={t(lang, "username")} />
                    <input className="input" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder={t(lang, "email")} />
                    <input className="input" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} placeholder={t(lang, "phone")} />
                    <input className="input" value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)} placeholder={t(lang, "fullName")} />
                    <select className="input" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER")}><option value="ADMIN">{t(lang, "roleAdmin")}</option><option value="ACCOUNTANT">{t(lang, "roleAccountant")}</option><option value="TEAM_LEADER">{t(lang, "roleLeader")}</option></select>
                    <input className="input" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder={t(lang, "newPassword")} />
                  </div>
                  <button className="btn-primary mt-2" onClick={createUser}>{t(lang, "create")}</button>

                  <div className="grid gap-2 mt-4 md:grid-cols-2">
                    <div className="card">
                      <h3 className="subtitle">{l(lang, "Quản lý vai trò", "Role management")}</h3>
                      <div className="grid gap-2 mt-2">
                        <input className="input" value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())} placeholder={l(lang, "Mã vai trò", "Role code")} />
                        <input className="input" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder={l(lang, "Tên vai trò", "Role name")} />
                        <button className="btn-secondary" onClick={createRole}>{l(lang, "Tạo vai trò", "Create role")}</button>
                      </div>
                      <select className="input mt-2" value={selectedRoleId} onChange={(e) => {
                        const rid = Number(e.target.value);
                        setSelectedRoleId(rid);
                        const role = roles.find((x) => x.id === rid);
                        setSelectedRolePermissionIds(role?.permissions?.map((rp) => rp.permission.id) ?? []);
                      }}>
                        <option value={0}>{l(lang, "Chọn vai trò", "Select role")}</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.code} - {r.name}</option>)}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {permissionItems.map((p) => (
                          <button key={p.id} className={`btn-chip ${selectedRolePermissionIds.includes(p.id) ? "active" : ""}`} onClick={() => toggleRolePermission(p.id)}>{p.code}</button>
                        ))}
                      </div>
                      <button className="btn-secondary mt-2" onClick={saveRolePermissions}>{l(lang, "Lưu quyền vai trò", "Save role permissions")}</button>
                    </div>

                    <div className="card">
                      <h3 className="subtitle">{l(lang, "Quản lý chức năng", "Function catalog")}</h3>
                      <div className="grid gap-2 mt-2">
                        <input className="input" value={newPermCode} onChange={(e) => setNewPermCode(e.target.value.toUpperCase())} placeholder={l(lang, "Mã chức năng", "Function code")} />
                        <input className="input" value={newPermName} onChange={(e) => setNewPermName(e.target.value)} placeholder={l(lang, "Tên chức năng", "Function name")} />
                        <input className="input" value={newPermModule} onChange={(e) => setNewPermModule(e.target.value.toUpperCase())} placeholder={l(lang, "Module", "Module")} />
                        <button className="btn-secondary" onClick={createPermission}>{l(lang, "Tạo chức năng", "Create function")}</button>
                      </div>

                      <h4 className="subtitle mt-3">{l(lang, "Gán vai trò cho người dùng", "Assign user roles")}</h4>
                      <select className="input mt-2" value={selectedUserIdForRoles} onChange={(e) => {
                        const uid = Number(e.target.value);
                        setSelectedUserIdForRoles(uid);
                        const u = users.find((x) => x.id === uid);
                        const ids = (u?.userRoles ?? []).map((ur) => roles.find((r) => r.code === ur.role.code)?.id).filter((x): x is number => Boolean(x));
                        setSelectedUserRoleIds(ids);
                      }}>
                        <option value={0}>{l(lang, "Chọn người dùng", "Select user")}</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {roles.map((r) => (
                          <button key={r.id} className={`btn-chip ${selectedUserRoleIds.includes(r.id) ? "active" : ""}`} onClick={() => toggleUserRole(r.id)}>{r.code}</button>
                        ))}
                      </div>
                      <button className="btn-secondary mt-2" onClick={saveUserRoles}>{l(lang, "Lưu vai trò người dùng", "Save user roles")}</button>
                    </div>
                  </div>
                </>
              )}
              <div className="table-wrap mt-3"><table><thead><tr><th>{t(lang, "username")}</th><th>{t(lang, "fullName")}</th><th>{t(lang, "role")}</th><th>{t(lang, "status")}</th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><td>{u.username}</td><td>{u.fullName}</td><td>{u.role}</td><td>{u.status}</td></tr>)}</tbody></table></div>
              {user.role === "ADMIN" && (
                <div className="table-wrap mt-3"><table><thead><tr><th>ID</th><th>{t(lang, "createdBy")}</th><th>{t(lang, "name")}</th><th>{t(lang, "status")}</th><th>{t(lang, "noteField")}</th></tr></thead><tbody>{auditLogs.map((a) => <tr key={a.id}><td>{a.id}</td><td>{a.actor?.fullName}</td><td>{a.entity}</td><td>{a.action}</td><td>{a.detail}</td></tr>)}</tbody></table></div>
              )}
              <input className="input mt-2" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} placeholder={t(lang, "newPassword")} />
            </section>
          )}

          {tab === "reports" && (
            <section className="card">
              <h2 className="subtitle">{t(lang, "reports")}</h2>
              <div className="flex gap-2 mt-2">
                <button className="btn-secondary" onClick={downloadPaymentsCsv}>{l(lang, "Xuất thu phí CSV", "Export payments CSV")}</button>
                <button className="btn-secondary" onClick={downloadPaymentsPdf}>{l(lang, "Xuất thu phí PDF", "Export payments PDF")}</button>
                <button className="btn-secondary" onClick={downloadResidencyCsv}>{l(lang, "Xuất cư trú CSV", "Export residency CSV")}</button>
                <button className="btn-secondary" onClick={downloadResidencyPdf}>{l(lang, "Xuất cư trú PDF", "Export residency PDF")}</button>
                <button className="btn-secondary" onClick={() => downloadDebtSummaryCsv()}>{l(lang, "Xuất công nợ CSV", "Export debt CSV")}</button>
                <button className="btn-secondary" onClick={() => downloadDebtSummaryPdf()}>{l(lang, "Xuất công nợ PDF", "Export debt PDF")}</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-3">
                <BarChart title={l(lang, "Tỉ lệ thu theo từng tháng (%)", "Collection rate by month (%)")} data={(analytics?.collectionByMonth ?? []).map((x) => ({ label: x.label, value: x.rate }))} color="linear-gradient(90deg,#2b8a3e,#46b95e)" maxBars={8} />
                <BarChart title={l(lang, "Nợ theo số ngày trễ hạn đóng tiền", "Overdue debt by late-payment days")} data={(analytics?.aging ?? []).map((x) => ({ label: x.label, value: x.amount }))} color="linear-gradient(90deg,#d96b41,#ee9c5f)" formatter={formatVnd} maxBars={8} />
              </div>

              <div className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ cột hiển thị", "Column visibility")}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.keys(showPaymentColumns).map((key) => (
                    <button key={key} className={`btn-chip ${showPaymentColumns[key] ? "active" : ""}`} onClick={() => setShowPaymentColumns((prev) => ({ ...prev, [key]: !prev[key] }))}>{key}</button>
                  ))}
                  {selectedMonthDrilldown && <button className="btn-secondary" onClick={() => setSelectedMonthDrilldown("")}>{l(lang, "Xóa drilldown", "Clear drilldown")}</button>}
                </div>
              </div>

              {paymentView.length === 0 ? (
                <div className="empty-state mt-3">{l(lang, "Không có giao dịch phù hợp bộ lọc", "No payments match current filters")}</div>
              ) : (
                <div className="table-wrap mt-3">
                  <table>
                    <thead>
                      <tr>
                        {showPaymentColumns.receipt && <th>{t(lang, "receiptNo")}</th>}
                        {showPaymentColumns.period && <th>{t(lang, "period")}</th>}
                        {showPaymentColumns.fee && <th>{t(lang, "name")}</th>}
                        {showPaymentColumns.amount && <th>{t(lang, "amount")}</th>}
                        {showPaymentColumns.method && <th>{t(lang, "method")}</th>}
                        {showPaymentColumns.collector && <th>{t(lang, "collector")}</th>}
                        {showPaymentColumns.payer && <th>{l(lang, "Người nộp", "Payer")}</th>}
                        {showPaymentColumns.txRef && <th>{l(lang, "Mã GD", "Tx Ref")}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPayments.map((p) => {
                        const o = obligations.find((x) => x.id === p.obligationId);
                        const period = periods.find((x) => x.id === o?.periodId);
                        const ft = feeTypes.find((x) => x.id === p.feeTypeId);
                        return (
                          <tr key={p.id}>
                            {showPaymentColumns.receipt && <td>{p.receiptNo}</td>}
                            {showPaymentColumns.period && <td>{period?.month}/{period?.year}</td>}
                            {showPaymentColumns.fee && <td>{ft?.name}</td>}
                            {showPaymentColumns.amount && <td>{formatVnd(p.paidAmount)}</td>}
                            {showPaymentColumns.method && <td>{p.method}</td>}
                            {showPaymentColumns.collector && <td>{p.collectorName}</td>}
                            {showPaymentColumns.payer && <td>{p.payerName || "-"}</td>}
                            {showPaymentColumns.txRef && <td>{p.bankTxRef || "-"}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button className="btn-secondary" disabled={pagePayments <= 1} onClick={() => setPagePayments((p) => Math.max(1, p - 1))}>{l(lang, "Trước", "Prev")}</button>
                <button className="btn-secondary" disabled={pagePayments * pageSize >= paymentView.length} onClick={() => setPagePayments((p) => p + 1)}>{l(lang, "Sau", "Next")}</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-3">
                <article className="card">
                  <h3 className="subtitle">{l(lang, "Top người thu", "Top collectors")}</h3>
                  {(analytics?.byCollector ?? []).slice(0, 6).map((x) => <p className="muted mt-1" key={x.collector}>{x.collector}: {formatVnd(x.amount)}</p>)}
                </article>
                <article className="card">
                  <h3 className="subtitle">{l(lang, "Hiệu quả theo tầng", "Collection by floor")}</h3>
                  {(analytics?.byFloor ?? []).slice(0, 8).map((x) => <p className="muted mt-1" key={x.floor}>{l(lang, "Tầng", "Floor")} {x.floor}: {x.rate}%</p>)}
                </article>
              </div>
            </section>
          )}

          {tab === "account" && (
            <>
              <AccountPanel
                user={user}
                lang={lang}
                profileFullName={profileFullName}
                setProfileFullName={setProfileFullName}
                profileEmail={profileEmail}
                setProfileEmail={setProfileEmail}
                profilePhone={profilePhone}
                setProfilePhone={setProfilePhone}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPasswordSelf={newPasswordSelf}
                setNewPasswordSelf={setNewPasswordSelf}
                setUser={setUser}
                changePasswordSelf={changePasswordSelf}
                refreshAllFromApi={refreshAllFromApi}
                l={l}
              />
              <section className="card">
                <h3 className="subtitle">{l(lang, "Tải ảnh đại diện", "Upload avatar")}</h3>
                <input
                  className="input mt-2"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                  }}
                />
                <p className="muted mt-2">{l(lang, "Hỗ trợ PNG/JPEG/WEBP, tối đa 2MB", "Supports PNG/JPEG/WEBP, max 2MB")}</p>
              </section>
            </>
          )}

          {tab === "handbook" && (
            <section className="card space-y-4">
              <h2 className="subtitle">{l(lang, "Sổ tay sử dụng", "User handbook")}</h2>

              <article className="card">
                <h3 className="subtitle">{l(lang, "1) Đăng nhập và ngôn ngữ", "1) Login and language")}</h3>
                {lang === "vi" ? (
                  <>
                    <p className="muted mt-2">- Đăng nhập bằng tên đăng nhập hoặc email.</p>
                    <p className="muted">- Dùng nút ngôn ngữ ở góc phải để chuyển Việt/Anh.</p>
                    <p className="muted">- Nếu sai mật khẩu nhiều lần, tài khoản có thể bị khóa tạm thời.</p>
                  </>
                ) : (
                  <>
                    <p className="muted mt-2">- Sign in with username or email.</p>
                    <p className="muted">- Use the language switcher in the top-right corner.</p>
                    <p className="muted">- Too many wrong passwords may trigger temporary lockout.</p>
                  </>
                )}
              </article>

              <article className="card">
                <h3 className="subtitle">{l(lang, "2) Điều hướng chính", "2) Main navigation")}</h3>
                {lang === "vi" ? (
                  <>
                    <p className="muted mt-2">- Tổng quan: theo dõi KPI và cảnh báo cần chú ý.</p>
                    <p className="muted">- Khoản thu/Đợt thu: cấu hình chính sách và kỳ thu.</p>
                    <p className="muted">- Nghĩa vụ & Thu phí: ghi nhận thu và xem timeline giao dịch.</p>
                    <p className="muted">- Hộ khẩu/Nhân khẩu/Biến động: quản lý cư trú.</p>
                    <p className="muted">- Báo cáo: biểu đồ phân tích và bảng xuất dữ liệu.</p>
                  </>
                ) : (
                  <>
                    <p className="muted mt-2">- Dashboard: KPI overview and attention widgets.</p>
                    <p className="muted">- Fee Types/Periods: fee policy and period setup.</p>
                    <p className="muted">- Obligations & Payments: collection and payment timeline.</p>
                    <p className="muted">- Households/Residents/Events: residency management.</p>
                    <p className="muted">- Reports: analytics charts and data table.</p>
                  </>
                )}
              </article>

              <article className="card">
                <h3 className="subtitle">{l(lang, "3) Quy trình nghiệp vụ gợi ý", "3) Recommended workflow")}</h3>
                {lang === "vi" ? (
                  <>
                    <p className="muted mt-2">B1. Khai báo hộ khẩu và nhân khẩu.</p>
                    <p className="muted">B2. Tạo danh mục khoản thu và đợt thu.</p>
                    <p className="muted">B3. Sinh nghĩa vụ thu và vào tab Nghĩa vụ để thu phí.</p>
                    <p className="muted">B4. Theo dõi dashboard, báo cáo và lịch sử nhắc phí.</p>
                  </>
                ) : (
                  <>
                    <p className="muted mt-2">Step 1. Create households and residents.</p>
                    <p className="muted">Step 2. Define fee types and fee periods.</p>
                    <p className="muted">Step 3. Generate obligations and collect payments.</p>
                    <p className="muted">Step 4. Monitor dashboard/reports and communication logs.</p>
                  </>
                )}
              </article>

              <article className="card">
                <h3 className="subtitle">{l(lang, "4) Mẹo sử dụng nhanh", "4) Quick tips")}</h3>
                {lang === "vi" ? (
                  <>
                    <p className="muted mt-2">- Dùng ô tìm kiếm toàn cục để tìm nhanh căn hộ/phiếu thu.</p>
                    <p className="muted">- Nhấn vào cột biểu đồ theo tháng để drilldown giao dịch.</p>
                    <p className="muted">- Trong tab Báo cáo có thể bật/tắt cột hiển thị.</p>
                    <p className="muted">- Mobile có thanh thao tác nhanh ở cuối màn hình.</p>
                  </>
                ) : (
                  <>
                    <p className="muted mt-2">- Use global search for apartment/receipt lookup.</p>
                    <p className="muted">- Click monthly chart bars for transaction drilldown.</p>
                    <p className="muted">- Toggle report table columns to focus your view.</p>
                    <p className="muted">- On mobile, use the bottom quick-action bar.</p>
                  </>
                )}
              </article>
            </section>
          )}

          <section className="quick-actions">
            <button className="btn-primary" onClick={() => setTab("obligations")}>{l(lang, "Thu phí", "Collect")}</button>
            <button className="btn-primary" onClick={() => setTab("residents")}>{l(lang, "Thêm cư dân", "Add resident")}</button>
            <button className="btn-primary" onClick={() => setTab("reports")}>{l(lang, "Xem báo cáo", "Reports")}</button>
          </section>
        </div>
      </section>
    </main>
  );
}
