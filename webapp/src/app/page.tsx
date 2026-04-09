"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@/components/BarChart";
import { AccountPanel } from "@/components/AccountPanel";
import { AuthCard } from "@/components/AuthCard";
import { DonutChart } from "@/components/DonutChart";
import { HelpModal } from "@/components/HelpModal";
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
  const [theme, setTheme] = useState<"blue" | "green" | "pink" | "red" | "yellow">("blue");
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
  const [selectedPaymentHouseholdId, setSelectedPaymentHouseholdId] = useState<number>(0);
  const [selectedPaymentFeeTypeId, setSelectedPaymentFeeTypeId] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [collectorName, setCollectorName] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [bankTxRef, setBankTxRef] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [reversalNote, setReversalNote] = useState("");

  const [newApartmentNo, setNewApartmentNo] = useState("");
  const [newFloorNo, setNewFloorNo] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newEmergencyName, setNewEmergencyName] = useState("");
  const [newEmergencyPhone, setNewEmergencyPhone] = useState("");
  const [newParkingSlots, setNewParkingSlots] = useState("0");
  const [newMoveInDate, setNewMoveInDate] = useState("");
  const [newOwnershipStatus, setNewOwnershipStatus] = useState<"OWNER" | "TENANT">("OWNER");
  const [newContractEndDate, setNewContractEndDate] = useState("");
  const [newAreaM2, setNewAreaM2] = useState("");

  const [newResidentName, setNewResidentName] = useState("");
  const [newResidentHouseholdId, setNewResidentHouseholdId] = useState<number>(0);
  const [newResidentType, setNewResidentType] = useState<"PERMANENT" | "TEMPORARY">("PERMANENT");
  const [newResidentDob, setNewResidentDob] = useState("");
  const [newResidentGender, setNewResidentGender] = useState<"MALE" | "FEMALE" | "OTHER">("FEMALE");
  const [newResidentIdNo, setNewResidentIdNo] = useState("");

  const [newFeeCode, setNewFeeCode] = useState("");
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeCategory, setNewFeeCategory] = useState<"MANDATORY" | "VOLUNTARY">("VOLUNTARY");
  const [newFeeMethod, setNewFeeMethod] = useState<"PER_M2" | "FIXED">("FIXED");
  const [newFeeRate, setNewFeeRate] = useState("");
  const [newFeeGraceDays, setNewFeeGraceDays] = useState("0");
  const [newFeeLateRule, setNewFeeLateRule] = useState("");
  const [newFeeEffectiveFrom, setNewFeeEffectiveFrom] = useState("");
  const [newFeeEffectiveTo, setNewFeeEffectiveTo] = useState("");
  const [newFeePolicyNote, setNewFeePolicyNote] = useState("");

  const [newPeriodFeeTypeId, setNewPeriodFeeTypeId] = useState<number>(0);
  const [newPeriodMonth, setNewPeriodMonth] = useState("");
  const [newPeriodYear, setNewPeriodYear] = useState("");
  const [newPeriodStatus, setNewPeriodStatus] = useState<"OPEN" | "CLOSED">("OPEN");

  const [eventResidentId, setEventResidentId] = useState<number>(0);
  const [eventType, setEventType] = useState<"TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT">("TEMP_RESIDENCE");
  const [eventFromDate, setEventFromDate] = useState("");
  const [eventToDate, setEventToDate] = useState("");
  const [eventNote, setEventNote] = useState("");

  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "ACCOUNTANT" | "TEAM_LEADER">("ACCOUNTANT");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [editingHouseholdId, setEditingHouseholdId] = useState<number | null>(null);
  const [editingResidentId, setEditingResidentId] = useState<number | null>(null);
  const [editingFeeTypeId, setEditingFeeTypeId] = useState<number | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [selectedResidentIds, setSelectedResidentIds] = useState<number[]>([]);
  const [selectedFeeTypeIds, setSelectedFeeTypeIds] = useState<number[]>([]);
  const [inspectHouseholdId, setInspectHouseholdId] = useState<number | null>(null);
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermCode, setNewPermCode] = useState("");
  const [newPermName, setNewPermName] = useState("");
  const [newPermModule, setNewPermModule] = useState("");
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
  const [helpModal, setHelpModal] = useState<{ open: boolean; title: string; lines: string[] }>({ open: false, title: "", lines: [] });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [filterResidentGender, setFilterResidentGender] = useState<"all" | "MALE" | "FEMALE" | "OTHER">("all");
  const [filterResidentType, setFilterResidentType] = useState<"all" | "PERMANENT" | "TEMPORARY">("all");
  const [filterResidentFloor, setFilterResidentFloor] = useState<number | "all">("all");
  const [filterHouseholdQuery, setFilterHouseholdQuery] = useState("");
  const [filterHouseholdOwnership, setFilterHouseholdOwnership] = useState<"all" | "OWNER" | "TENANT">("all");
  const [filterHouseholdFloor, setFilterHouseholdFloor] = useState<number | "all">("all");
  const [filterFeeQuery, setFilterFeeQuery] = useState("");
  const [filterFeeCategory, setFilterFeeCategory] = useState<"all" | "MANDATORY" | "VOLUNTARY">("all");
  const [filterFeeMethod, setFilterFeeMethod] = useState<"all" | "PER_M2" | "FIXED">("all");
  const [filterPeriodQuery, setFilterPeriodQuery] = useState("");
  const [filterPeriodStatus, setFilterPeriodStatus] = useState<"all" | "OPEN" | "CLOSED">("all");
  const [filterPeriodFeeTypeId, setFilterPeriodFeeTypeId] = useState<number | "all">("all");
  const [filterEventQuery, setFilterEventQuery] = useState("");
  const [filterEventType, setFilterEventType] = useState<"all" | "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT">("all");
  const [filterEventResidentId, setFilterEventResidentId] = useState<number | "all">("all");
  const [filterUserQuery, setFilterUserQuery] = useState("");
  const [filterUserRole, setFilterUserRole] = useState<"all" | "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER">("all");
  const [filterUserStatus, setFilterUserStatus] = useState<"all" | "ACTIVE" | "BLOCKED">("all");
  const [filterPaymentCollector, setFilterPaymentCollector] = useState("");
  const [filterPaymentPayer, setFilterPaymentPayer] = useState("");
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
    note: true,
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

  function showGuide(title: string, lines: string[]) {
    setHelpModal({ open: true, title, lines });
  }

  function setFieldError(key: string, message: string) {
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
  }

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
      const firstOb = o[0];
      const firstPeriod = firstOb ? p.find((x) => x.id === firstOb.periodId) : null;
      setSelectedPaymentHouseholdId((prev) => (prev || h[0]?.id || 0));
      setSelectedPaymentFeeTypeId((prev) => (prev || firstPeriod?.feeTypeId || 0));
      setSelectedObligationId((prev) => (prev || o[0]?.id || 0));
      setSelectedRoleId((prev) => (prev || roleRows[0]?.id || 0));
      setSelectedUserIdForRoles((prev) => (prev || u[0]?.id || 0));
    } catch {
      setErrorText(l(lang, "Không thể tải dữ liệu", "Cannot load data"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

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

  useEffect(() => {
    const cls = ["theme-blue", "theme-green", "theme-pink", "theme-red", "theme-yellow"];
    document.body.classList.remove(...cls);
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const searchToken = globalSearch.trim().toLowerCase();
  const householdFilterToken = filterHouseholdQuery.trim().toLowerCase();
  const feeFilterToken = filterFeeQuery.trim().toLowerCase();
  const periodFilterToken = filterPeriodQuery.trim().toLowerCase();
  const eventFilterToken = filterEventQuery.trim().toLowerCase();
  const userFilterToken = filterUserQuery.trim().toLowerCase();
  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      const base = `${h.apartmentNo} ${h.ownerName} ${h.ownerPhone}`.toLowerCase();
      if (searchToken && !base.includes(searchToken)) return false;
      if (householdFilterToken && !base.includes(householdFilterToken)) return false;
      if (filterHouseholdOwnership !== "all" && h.ownershipStatus !== filterHouseholdOwnership) return false;
      if (filterHouseholdFloor !== "all" && h.floorNo !== filterHouseholdFloor) return false;
      return true;
    });
  }, [households, searchToken, householdFilterToken, filterHouseholdOwnership, filterHouseholdFloor]);
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
  const filteredFeeTypes = useMemo(
    () =>
      feeTypes.filter((f) => {
        if (`${f.code} ${f.name} ${f.category}`.toLowerCase().includes(feeFilterToken) === false) return false;
        if (filterFeeCategory !== "all" && f.category !== filterFeeCategory) return false;
        if (filterFeeMethod !== "all" && f.calcMethod !== filterFeeMethod) return false;
        return true;
      }),
    [feeTypes, feeFilterToken, filterFeeCategory, filterFeeMethod],
  );
  const filteredPeriods = useMemo(() => periods.filter((p) => {
    const ft = feeTypes.find((f) => f.id === p.feeTypeId);
    const text = `${p.id} ${ft?.name ?? ""} ${p.month}/${p.year} ${p.status}`.toLowerCase();
    if (!text.includes(periodFilterToken)) return false;
    if (filterPeriodStatus !== "all" && p.status !== filterPeriodStatus) return false;
    if (filterPeriodFeeTypeId !== "all" && p.feeTypeId !== filterPeriodFeeTypeId) return false;
    return true;
  }), [periods, feeTypes, periodFilterToken, filterPeriodStatus, filterPeriodFeeTypeId]);
  const filteredEvents = useMemo(() => events.filter((ev) => {
    const r = residents.find((x) => x.id === ev.residentId);
    const text = `${r?.fullName ?? ""} ${ev.eventType} ${ev.note}`.toLowerCase();
    if (!text.includes(eventFilterToken)) return false;
    if (filterEventType !== "all" && ev.eventType !== filterEventType) return false;
    if (filterEventResidentId !== "all" && ev.residentId !== filterEventResidentId) return false;
    return true;
  }), [events, residents, eventFilterToken, filterEventType, filterEventResidentId]);
  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        if (!`${u.username} ${u.fullName} ${u.role} ${u.status}`.toLowerCase().includes(userFilterToken)) return false;
        if (filterUserRole !== "all" && u.role !== filterUserRole) return false;
        if (filterUserStatus !== "all" && u.status !== filterUserStatus) return false;
        return true;
      }),
    [users, userFilterToken, filterUserRole, filterUserStatus],
  );
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
      if (filterPaymentMethod !== "all" && p.method !== filterPaymentMethod) return false;
      if (filterPaymentCollector && p.collectorName !== filterPaymentCollector) return false;
      if (filterPaymentPayer && (p.payerName ?? "") !== filterPaymentPayer) return false;
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
  }, [payments, obligations, periods, feeTypes, filterMonth, filterYear, filterType, filterPaymentMethod, filterPaymentCollector, filterPaymentPayer, filterPaymentFromDate, filterPaymentToDate, searchToken]);
  const pagedPayments = useMemo(() => paymentView.slice((pagePayments - 1) * pageSize, pagePayments * pageSize), [paymentView, pagePayments]);

  const selectedObligation = obligations.find((o) => o.id === selectedObligationId);
  const selectablePaymentObligations = useMemo(() => {
    const rows = obligations
      .map((o) => {
        const period = periods.find((p) => p.id === o.periodId);
        if (!period) return null;
        return { ...o, period };
      })
      .filter((x): x is Obligation & { period: FeePeriod } => Boolean(x));
    return rows.filter((o) => {
      if (selectedPaymentHouseholdId && o.householdId !== selectedPaymentHouseholdId) return false;
      if (selectedPaymentFeeTypeId && o.period.feeTypeId !== selectedPaymentFeeTypeId) return false;
      return o.amountDue - o.amountPaid > 0;
    });
  }, [obligations, periods, selectedPaymentHouseholdId, selectedPaymentFeeTypeId]);

  const paymentHouseholdOutstanding = useMemo(() => {
    if (!selectedPaymentHouseholdId) return 0;
    return obligations
      .filter((o) => o.householdId === selectedPaymentHouseholdId)
      .reduce((s, o) => s + Math.max(0, o.amountDue - o.amountPaid), 0);
  }, [obligations, selectedPaymentHouseholdId]);

  const selectedObligationWithMeta = useMemo(() => {
    if (!selectedObligation) return null;
    const period = periods.find((p) => p.id === selectedObligation.periodId);
    if (!period) return null;
    const feeType = feeTypes.find((f) => f.id === period.feeTypeId);
    const dueDate = new Date(period.year, period.month - 1, 1);
    const overdueDays = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return { period, feeType, overdueDays };
  }, [selectedObligation, periods, feeTypes]);

  useEffect(() => {
    if (selectablePaymentObligations.length === 0) {
      if (selectedObligationId !== 0) setSelectedObligationId(0);
      return;
    }
    const existed = selectablePaymentObligations.some((o) => o.id === selectedObligationId);
    if (!existed) setSelectedObligationId(selectablePaymentObligations[0].id);
  }, [selectablePaymentObligations, selectedObligationId]);

  const stats = useMemo(() => {
    const totalDue = obligations.reduce((s, o) => s + o.amountDue, 0);
    const totalPaid = obligations.reduce((s, o) => s + o.amountPaid, 0);
    const outstanding = totalDue - totalPaid;
    const overdueObligations = obligations.filter((o) => {
      const period = periods.find((p) => p.id === o.periodId);
      if (!period) return false;
      const dueDate = new Date(period.year, period.month - 1, 1);
      return dueDate.getTime() < Date.now();
    });
    const obligationsByHousehold = new Map<number, { due: number; paid: number; count: number }>();
    for (const o of overdueObligations) {
      const current = obligationsByHousehold.get(o.householdId) ?? { due: 0, paid: 0, count: 0 };
      current.due += o.amountDue;
      current.paid += o.amountPaid;
      current.count += 1;
      obligationsByHousehold.set(o.householdId, current);
    }
    let paidHouseholds = 0;
    for (const h of households) {
      const bucket = obligationsByHousehold.get(h.id);
      if (!bucket || bucket.count === 0) {
        paidHouseholds += 1;
        continue;
      }
      const householdOutstanding = Math.max(0, bucket.due - bucket.paid);
      if (householdOutstanding === 0) paidHouseholds += 1;
    }
    return { totalDue, totalPaid, outstanding, paidHouseholds };
  }, [obligations, households, periods]);

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

  const paymentMethodDonutData = useMemo(() => {
    const cash = paymentView.filter((p) => p.method === "CASH").reduce((s, p) => s + p.paidAmount, 0);
    const bank = paymentView.filter((p) => p.method === "BANK").reduce((s, p) => s + p.paidAmount, 0);
    return [
      { label: t(lang, "paymentMethodCash"), value: cash, color: "#2f86ff" },
      { label: t(lang, "paymentMethodBank"), value: bank, color: "#10a3a3" },
    ];
  }, [paymentView, lang]);

  const collectorOptions = useMemo(() => {
    return Array.from(new Set(payments.map((p) => p.collectorName.trim()).filter((x) => x.length > 0))).sort((a, b) => a.localeCompare(b));
  }, [payments]);

  const payerFilterOptions = useMemo(() => {
    return Array.from(new Set(payments.map((p) => (p.payerName ?? "").trim()).filter((x) => x.length > 0))).sort((a, b) => a.localeCompare(b));
  }, [payments]);

  const residentPayerOptions = useMemo(() => {
    if (!selectedObligation) return [] as string[];
    return residents.filter((r) => r.householdId === selectedObligation.householdId).map((r) => r.fullName).sort((a, b) => a.localeCompare(b));
  }, [selectedObligation, residents]);

  useEffect(() => {
    if (!payerName) return;
    if (!residentPayerOptions.includes(payerName)) setPayerName("");
  }, [residentPayerOptions, payerName]);

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
    let valid = true;
    if (!newUserUsername.trim()) { setFieldError("newUserUsername", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newUserUsername");
    if (!newUserEmail.trim()) { setFieldError("newUserEmail", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newUserEmail");
    if (!newUserPhone.trim()) { setFieldError("newUserPhone", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newUserPhone");
    if (!newUserFullName.trim()) { setFieldError("newUserFullName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newUserFullName");
    if (!newUserPassword.trim()) { setFieldError("newUserPassword", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newUserPassword");
    if (!valid) return;
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
    let valid = true;
    if (!newRoleCode.trim()) { setFieldError("newRoleCode", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newRoleCode");
    if (!newRoleName.trim()) { setFieldError("newRoleName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newRoleName");
    if (!valid) return;
    void apiPost(`${API_BASE}/roles`, { code: newRoleCode, name: newRoleName }).then(async () => {
      await refreshAllFromApi();
    });
  }

  function createPermission() {
    let valid = true;
    if (!newPermCode.trim()) { setFieldError("newPermCode", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newPermCode");
    if (!newPermName.trim()) { setFieldError("newPermName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newPermName");
    if (!newPermModule.trim()) { setFieldError("newPermModule", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newPermModule");
    if (!valid) return;
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
    let valid = true;
    if (!newApartmentNo.trim()) { setFieldError("newApartmentNo", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newApartmentNo");
    if (!Number.isFinite(floor)) { setFieldError("newFloorNo", l(lang, "Tầng không hợp lệ", "Invalid floor")); valid = false; } else clearFieldError("newFloorNo");
    if (!newOwnerName.trim()) { setFieldError("newOwnerName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newOwnerName");
    if (!newOwnerPhone.trim()) { setFieldError("newOwnerPhone", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newOwnerPhone");
    if (!Number.isFinite(area) || area <= 0) { setFieldError("newAreaM2", l(lang, "Diện tích không hợp lệ", "Invalid area")); valid = false; } else clearFieldError("newAreaM2");
    if (!Number.isFinite(parkingSlots) || parkingSlots < 0) { setFieldError("newParkingSlots", l(lang, "Số chỗ xe không hợp lệ", "Invalid parking slots")); valid = false; } else clearFieldError("newParkingSlots");
    if (!valid) return;
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
    let valid = true;
    if (!newFeeCode.trim()) { setFieldError("newFeeCode", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newFeeCode");
    if (!newFeeName.trim()) { setFieldError("newFeeName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newFeeName");
    if (!Number.isFinite(rate) || rate <= 0) { setFieldError("newFeeRate", l(lang, "Mức thu không hợp lệ", "Invalid rate")); valid = false; } else clearFieldError("newFeeRate");
    if (!Number.isFinite(graceDays) || graceDays < 0) { setFieldError("newFeeGraceDays", l(lang, "Ân hạn không hợp lệ", "Invalid grace days")); valid = false; } else clearFieldError("newFeeGraceDays");
    if (!valid) return;
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
    let valid = true;
    if (!newResidentName.trim()) { setFieldError("newResidentName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newResidentName");
    if (!newResidentHouseholdId) { setFieldError("newResidentHouseholdId", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newResidentHouseholdId");
    if (!newResidentDob) { setFieldError("newResidentDob", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newResidentDob");
    if (!newResidentIdNo.trim()) { setFieldError("newResidentIdNo", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newResidentIdNo");
    if (!valid) return;
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
    let valid = true;
    if (!newPeriodFeeTypeId) { setFieldError("newPeriodFeeTypeId", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("newPeriodFeeTypeId");
    if (!Number.isInteger(month) || month < 1 || month > 12) { setFieldError("newPeriodMonth", l(lang, "Tháng 1-12", "Month must be 1-12")); valid = false; } else clearFieldError("newPeriodMonth");
    if (!Number.isInteger(year) || year < 2000) { setFieldError("newPeriodYear", l(lang, "Năm không hợp lệ", "Invalid year")); valid = false; } else clearFieldError("newPeriodYear");
    if (!valid) return;
    void apiPost(`${API_BASE}/periods`, { feeTypeId: newPeriodFeeTypeId, month, year }).then(async () => {
      await refreshAllFromApi();
      await refreshAuditLogs();
    });
  }

  function savePeriodEdit() {
    if (!editingPeriodId) return;
    const month = Number(newPeriodMonth);
    const year = Number(newPeriodYear);
    if (!newPeriodFeeTypeId) return;
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
    if (!selectedObligation || selectedObligation.id === 0) {
      setFieldError("selectedObligationId", l(lang, "Chọn nghĩa vụ", "Select obligation"));
      return;
    }
    clearFieldError("selectedObligationId");
    const amount = Number(paymentAmount);
    let valid = true;
    if (!Number.isFinite(amount) || amount <= 0) { setFieldError("paymentAmount", l(lang, "Số tiền không hợp lệ", "Invalid amount")); valid = false; } else clearFieldError("paymentAmount");
    if (!collectorName.trim()) { setFieldError("collectorName", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("collectorName");
    if (!valid) return;
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
    let valid = true;
    if (!eventResidentId) { setFieldError("eventResidentId", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("eventResidentId");
    if (!eventFromDate) { setFieldError("eventFromDate", l(lang, "Bắt buộc", "Required")); valid = false; } else clearFieldError("eventFromDate");
    if (!valid) return;
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
    void downloadFile(`${API_BASE}/reports/payments?${params.toString()}`, "payment_report.csv");
  }

  function downloadPaymentsPdf() {
    const params = new URLSearchParams();
    params.set("format", "pdf");
    if (filterMonth !== "all") params.set("month", String(filterMonth));
    if (filterYear !== "all") params.set("year", String(filterYear));
    void downloadFile(`${API_BASE}/reports/payments?${params.toString()}`, "payment_report.pdf");
  }

  function downloadResidencyCsv() {
    void downloadFile(`${API_BASE}/reports/residency`, "residency_report.csv");
  }

  function downloadResidencyPdf() {
    void downloadFile(`${API_BASE}/reports/residency?format=pdf`, "residency_report.pdf");
  }

  function downloadDebtSummaryCsv(householdId?: number) {
    const params = new URLSearchParams();
    if (householdId) params.set("householdId", String(householdId));
    void downloadFile(`${API_BASE}/reports/debt-summary?${params.toString()}`, "debt_summary.csv");
  }

  function downloadDebtSummaryPdf(householdId?: number) {
    const params = new URLSearchParams();
    params.set("format", "pdf");
    if (householdId) params.set("householdId", String(householdId));
    void downloadFile(`${API_BASE}/reports/debt-summary?${params.toString()}`, "debt_summary.pdf");
  }

  function printPaymentReceipt(paymentId: number) {
    void downloadFile(`${API_BASE}/payments/${paymentId}/receipt`, `payment_receipt_${paymentId}.pdf`);
  }

  async function downloadFile(url: string, fallbackName: string) {
    try {
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || l(lang, "Tải file thất bại", "Download failed"));
      }
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const m = /filename=([^;]+)/i.exec(cd);
      const fileName = (m?.[1] || fallbackName).replace(/"/g, "").trim();
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : l(lang, "Tải file thất bại", "Download failed");
      notify("error", msg);
    }
  }

  if (!user) {
    return (
      <>
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
        <HelpModal open={helpModal.open} title={helpModal.title} lines={helpModal.lines} onClose={() => setHelpModal({ open: false, title: "", lines: [] })} />
      </>
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
          <select className="input" value={theme} onChange={(e) => setTheme(e.target.value as "blue" | "green" | "pink" | "red" | "yellow")} style={{ width: 130 }}>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="pink">Pink</option>
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
          </select>
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
                <BarChart title={t(lang, "chartByMonth")} data={monthlyChartData.length ? monthlyChartData : [{ label: t(lang, "noData"), value: 0 }]} color="linear-gradient(90deg,#0f5fdf,#2f86ff)" formatter={formatVnd} maxBars={8} paginationLabels={{ prev: t(lang, "chartPrev"), next: t(lang, "chartNext"), showing: t(lang, "chartShowing") }} />
                <BarChart title={t(lang, "chartByType")} data={typeChartData.length ? typeChartData : [{ label: t(lang, "noData"), value: 0 }]} color="linear-gradient(90deg,#10a3a3,#26c7b0)" formatter={formatVnd} maxBars={8} paginationLabels={{ prev: t(lang, "chartPrev"), next: t(lang, "chartNext"), showing: t(lang, "chartShowing") }} />
              </section>
               <section className="grid gap-4 md:grid-cols-2">
                 <DonutChart title={l(lang, "Tỉ trọng phương thức thanh toán", "Payment method split")} totalLabel={l(lang, "Tổng thu", "Total collected")} data={paymentMethodDonutData} />
                 <article className="card">
                   <h3 className="subtitle">{l(lang, "Top căn hộ nợ cao", "Top outstanding households")}</h3>
                   {Array.from(
                     obligations.reduce((map, o) => {
                       const period = periods.find((p) => p.id === o.periodId);
                       if (!period) return map;
                       const dueDate = new Date(period.year, period.month - 1, 1);
                       if (dueDate.getTime() >= Date.now()) return map;
                       const key = o.householdId;
                       const current = map.get(key) ?? { debt: 0, overdueFeeCount: 0 };
                       const debt = Math.max(0, o.amountDue - o.amountPaid);
                       if (debt > 0) {
                         current.debt += debt;
                         current.overdueFeeCount += 1;
                       }
                       map.set(key, current);
                       return map;
                     }, new Map<number, { debt: number; overdueFeeCount: number }>()),
                   )
                     .map(([householdId, info]) => ({
                       apartmentNo: households.find((h) => h.id === householdId)?.apartmentNo ?? String(householdId),
                       debt: info.debt,
                       overdueFeeCount: info.overdueFeeCount,
                     }))
                     .filter((x) => x.debt > 0)
                     .sort((a, b) => b.debt - a.debt)
                     .slice(0, 6)
                     .map((x) => (
                       <p className="muted mt-1" key={`${x.apartmentNo}-${x.debt}`}>{x.apartmentNo}: {formatVnd(x.debt)} ({x.overdueFeeCount} {l(lang, "khoản quá hạn", "overdue fees")})</p>
                     ))}
                  </article>
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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "households")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn nhập hộ khẩu", "Household form guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "Ví dụ căn hộ: D-1501", "Example apartment: D-1501"),
                    l(lang, "Ví dụ chủ hộ: Nguyễn Văn A, SĐT: 0903123456", "Example owner: John Doe, phone: 0903123456"),
                    l(lang, "Ngày vào ở: ngày bắt đầu sinh sống tại căn hộ.", "Move-in date: when household starts living in this apartment."),
                    l(lang, "Ngày hết hợp đồng: chỉ nhập khi là người thuê có hợp đồng.", "Contract end date: usually for tenants with lease contract."),
                    l(lang, "Diện tích nhập số dương, ví dụ: 74", "Area must be positive number, e.g. 74"),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <p className="muted mt-1">{l(lang, "Giải thích ngày: 'Ngày vào ở' là lúc bắt đầu ở; 'Ngày hết hợp đồng' dùng cho căn hộ thuê (có thể để trống với chủ hộ).", "Date meaning: 'Move-in date' is when living starts; 'Contract end date' is for tenant leases (optional for owners).")}</p>
              <div className="grid gap-2 mt-3 md:grid-cols-4">
                <div><input className="input" value={newApartmentNo} onChange={(e) => { setNewApartmentNo(e.target.value); clearFieldError("newApartmentNo"); }} placeholder={`${t(lang, "apartment")} *`} />{fieldErrors.newApartmentNo && <p className="field-error">{fieldErrors.newApartmentNo}</p>}</div>
                <div><input className="input" value={newFloorNo} onChange={(e) => { setNewFloorNo(e.target.value); clearFieldError("newFloorNo"); }} placeholder={`${t(lang, "floor")} *`} />{fieldErrors.newFloorNo && <p className="field-error">{fieldErrors.newFloorNo}</p>}</div>
                <div><input className="input" value={newOwnerName} onChange={(e) => { setNewOwnerName(e.target.value); clearFieldError("newOwnerName"); }} placeholder={`${t(lang, "owner")} *`} />{fieldErrors.newOwnerName && <p className="field-error">{fieldErrors.newOwnerName}</p>}</div>
                <div><input className="input" value={newOwnerPhone} onChange={(e) => { setNewOwnerPhone(e.target.value); clearFieldError("newOwnerPhone"); }} placeholder={`${t(lang, "phone")} *`} />{fieldErrors.newOwnerPhone && <p className="field-error">{fieldErrors.newOwnerPhone}</p>}</div>
                <input className="input" value={newEmergencyName} onChange={(e) => setNewEmergencyName(e.target.value)} placeholder={l(lang, "Người liên hệ khẩn", "Emergency contact")} />
                <input className="input" value={newEmergencyPhone} onChange={(e) => setNewEmergencyPhone(e.target.value)} placeholder={l(lang, "SĐT khẩn", "Emergency phone")} />
                <div><input className="input" value={newParkingSlots} onChange={(e) => { setNewParkingSlots(e.target.value); clearFieldError("newParkingSlots"); }} placeholder={l(lang, "Số chỗ xe", "Parking slots")} />{fieldErrors.newParkingSlots && <p className="field-error">{fieldErrors.newParkingSlots}</p>}</div>
                <input className="input" type="date" value={newMoveInDate} onChange={(e) => setNewMoveInDate(e.target.value)} title={l(lang, "Ngày bắt đầu vào ở", "Move-in date")} />
                <select className="input" value={newOwnershipStatus} onChange={(e) => setNewOwnershipStatus(e.target.value as "OWNER" | "TENANT")}>
                  <option value="OWNER">{l(lang, "Chủ sở hữu", "Owner")}</option>
                  <option value="TENANT">{l(lang, "Người thuê", "Tenant")}</option>
                </select>
                <input className="input" type="date" value={newContractEndDate} onChange={(e) => setNewContractEndDate(e.target.value)} title={l(lang, "Ngày kết thúc hợp đồng thuê", "Contract end date")} />
                <div><input className="input" value={newAreaM2} onChange={(e) => { setNewAreaM2(e.target.value); clearFieldError("newAreaM2"); }} placeholder={`${t(lang, "area")} (m2) *`} />{fieldErrors.newAreaM2 && <p className="field-error">{fieldErrors.newAreaM2}</p>}</div>
                {editingHouseholdId ? (
                  <div className="flex gap-2"><button className="btn-primary" onClick={saveHouseholdEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button><button className="btn-secondary" onClick={() => setEditingHouseholdId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
                ) : (
                  <button className="btn-primary" onClick={addHousehold}>{t(lang, "addHousehold")}</button>
                )}
              </div>

              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc danh sách hộ", "Household filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  <input className="input" value={filterHouseholdQuery} onChange={(e) => setFilterHouseholdQuery(e.target.value)} placeholder={l(lang, "Lọc hộ theo căn hộ/chủ hộ/số điện thoại", "Filter households by apartment/owner/phone")} />
                  <select className="input" value={String(filterHouseholdFloor)} onChange={(e) => setFilterHouseholdFloor(e.target.value === "all" ? "all" : Number(e.target.value))}>
                    <option value="all">{l(lang, "Mọi tầng", "All floors")}</option>
                    {Array.from(new Set(households.map((h) => h.floorNo))).sort((a, b) => a - b).map((floor) => <option key={floor} value={floor}>{l(lang, "Tầng", "Floor")} {floor}</option>)}
                  </select>
                  <select className="input" value={filterHouseholdOwnership} onChange={(e) => setFilterHouseholdOwnership(e.target.value as "all" | "OWNER" | "TENANT")}>
                    <option value="all">{l(lang, "Mọi trạng thái sở hữu", "All ownership")}</option>
                    <option value="OWNER">{l(lang, "Chủ sở hữu", "Owner")}</option>
                    <option value="TENANT">{l(lang, "Người thuê", "Tenant")}</option>
                  </select>
                  <button className="btn-secondary" onClick={() => { setFilterHouseholdQuery(""); setFilterHouseholdFloor("all"); setFilterHouseholdOwnership("all"); }}>{l(lang, "Xóa lọc", "Clear filter")}</button>
                </div>
              </section>

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
                            <button className="btn-secondary" onClick={() => setInspectHouseholdId(h.id)}>{l(lang, "Kiểm tra", "Inspect")}</button>
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

              {inspectHouseholdId && (() => {
                const hh = households.find((x) => x.id === inspectHouseholdId);
                if (!hh) return null;
                const hhResidents = residents.filter((r) => r.householdId === hh.id);
                const hhObligations = obligations.filter((o) => o.householdId === hh.id);
                const hhDebt = hhObligations.reduce((s, o) => s + Math.max(0, o.amountDue - o.amountPaid), 0);
                return (
                  <section className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Chi tiết căn", "Household inspection")}: {hh.apartmentNo}</h3>
                      <button className="btn-secondary" onClick={() => setInspectHouseholdId(null)}>{l(lang, "Đóng", "Close")}</button>
                    </div>
                    <p className="muted mt-2">{l(lang, "Chủ hộ", "Owner")}: {hh.ownerName} ({hh.ownerPhone})</p>
                    <p className="muted">{l(lang, "Số xe đăng ký", "Registered vehicles/slots")}: {hh.parkingSlots ?? 0}</p>
                    <p className="muted">{l(lang, "Tổng nợ hiện tại", "Current outstanding debt")}: {formatVnd(hhDebt)}</p>
                    <h4 className="subtitle mt-3">{l(lang, "Người trong hộ", "Residents")}</h4>
                    {hhResidents.length === 0 ? <p className="muted">{l(lang, "Chưa có cư dân", "No residents")}</p> : hhResidents.map((r) => <p key={r.id} className="muted">- {r.fullName} ({r.residentType})</p>)}
                    <h4 className="subtitle mt-3">{l(lang, "Nợ theo khoản phí", "Debt by fee")}</h4>
                    {hhObligations.length === 0 ? <p className="muted">{l(lang, "Chưa phát sinh nghĩa vụ", "No obligations")}</p> : hhObligations.map((o) => {
                      const period = periods.find((p) => p.id === o.periodId);
                      const ft = feeTypes.find((f) => f.id === period?.feeTypeId);
                      return <p key={o.id} className="muted">- {ft?.name ?? "-"} {period ? `(${period.month}/${period.year})` : ""}: {formatVnd(Math.max(0, o.amountDue - o.amountPaid))}</p>;
                    })}
                  </section>
                );
              })()}

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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "feeTypes")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn khoản phí", "Fee type guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "Mã khoản phí viết HOA, ví dụ: PARKING_FEE", "Code should be uppercase, e.g. PARKING_FEE"),
                    l(lang, "Mức thu là số dương, ví dụ: 120000", "Rate must be positive, e.g. 120000"),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <div className="grid gap-2 mt-3 md:grid-cols-4">
                <div><input className="input" placeholder={`${t(lang, "code")} *`} value={newFeeCode} onChange={(e) => { setNewFeeCode(e.target.value); clearFieldError("newFeeCode"); }} />{fieldErrors.newFeeCode && <p className="field-error">{fieldErrors.newFeeCode}</p>}</div>
                <div><input className="input" placeholder={`${t(lang, "name")} *`} value={newFeeName} onChange={(e) => { setNewFeeName(e.target.value); clearFieldError("newFeeName"); }} />{fieldErrors.newFeeName && <p className="field-error">{fieldErrors.newFeeName}</p>}</div>
                <select className="input" value={newFeeCategory} onChange={(e) => setNewFeeCategory(e.target.value as "MANDATORY" | "VOLUNTARY")}>
                  <option value="MANDATORY">{t(lang, "mandatory")}</option><option value="VOLUNTARY">{t(lang, "voluntary")}</option>
                </select>
                <select className="input" value={newFeeMethod} onChange={(e) => setNewFeeMethod(e.target.value as "PER_M2" | "FIXED")}>
                  <option value="PER_M2">{t(lang, "perM2")}</option><option value="FIXED">{t(lang, "fixed")}</option>
                </select>
                <div><input className="input" value={newFeeRate} onChange={(e) => { setNewFeeRate(e.target.value); clearFieldError("newFeeRate"); }} placeholder={`${t(lang, "rate")} *`} />{fieldErrors.newFeeRate && <p className="field-error">{fieldErrors.newFeeRate}</p>}</div>
                <div><input className="input" value={newFeeGraceDays} onChange={(e) => { setNewFeeGraceDays(e.target.value); clearFieldError("newFeeGraceDays"); }} placeholder={l(lang, "Ngày ân hạn", "Grace days")} />{fieldErrors.newFeeGraceDays && <p className="field-error">{fieldErrors.newFeeGraceDays}</p>}</div>
                <input className="input" value={newFeeLateRule} onChange={(e) => setNewFeeLateRule(e.target.value)} placeholder={l(lang, "Quy tắc phạt trễ", "Late fee rule")} />
                <input className="input" value={newFeePolicyNote} onChange={(e) => setNewFeePolicyNote(e.target.value)} placeholder={l(lang, "Ghi chú chính sách", "Policy note")} />
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-3">
                <input className="input" type="date" value={newFeeEffectiveFrom} onChange={(e) => setNewFeeEffectiveFrom(e.target.value)} />
                <input className="input" type="date" value={newFeeEffectiveTo} onChange={(e) => setNewFeeEffectiveTo(e.target.value)} />
                {editingFeeTypeId ? (
                  <div className="flex gap-2"><button className="btn-primary" onClick={saveFeeTypeEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button><button className="btn-secondary" onClick={() => setEditingFeeTypeId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
                ) : (
                  <button className="btn-primary" onClick={addFeeType}>{t(lang, "add")}</button>
                )}
              </div>
              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc khoản phí", "Fee filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  <input className="input" value={filterFeeQuery} onChange={(e) => setFilterFeeQuery(e.target.value)} placeholder={l(lang, "Lọc khoản phí theo mã/tên/loại", "Filter fee types by code/name/category")} />
                  <select className="input" value={filterFeeCategory} onChange={(e) => setFilterFeeCategory(e.target.value as "all" | "MANDATORY" | "VOLUNTARY")}>
                    <option value="all">{l(lang, "Mọi loại phí", "All categories")}</option>
                    <option value="MANDATORY">{t(lang, "mandatory")}</option>
                    <option value="VOLUNTARY">{t(lang, "voluntary")}</option>
                  </select>
                  <select className="input" value={filterFeeMethod} onChange={(e) => setFilterFeeMethod(e.target.value as "all" | "PER_M2" | "FIXED")}>
                    <option value="all">{l(lang, "Mọi cách tính", "All methods")}</option>
                    <option value="PER_M2">{t(lang, "perM2")}</option>
                    <option value="FIXED">{t(lang, "fixed")}</option>
                  </select>
                  <button className="btn-secondary" onClick={() => { setFilterFeeQuery(""); setFilterFeeCategory("all"); setFilterFeeMethod("all"); }}>{l(lang, "Xóa lọc", "Clear filter")}</button>
                </div>
              </section>
              <div className="table-wrap mt-3">
                <table>
                  <thead><tr><th><input type="checkbox" checked={filteredFeeTypes.length > 0 && filteredFeeTypes.every((x) => selectedFeeTypeIds.includes(x.id))} onChange={(e) => setSelectedFeeTypeIds(e.target.checked ? filteredFeeTypes.map((x) => x.id) : [])} /></th><th>{t(lang, "code")}</th><th>{t(lang, "name")}</th><th>{t(lang, "rate")}</th><th>{l(lang, "Ân hạn", "Grace")}</th><th>{l(lang, "Phạt trễ", "Late rule")}</th><th>{l(lang, "Thao tác", "Actions")}</th></tr></thead>
                  <tbody>{filteredFeeTypes.map((f) => <tr key={f.id}><td><input type="checkbox" checked={selectedFeeTypeIds.includes(f.id)} onChange={() => toggleFeeTypeSelection(f.id)} /></td><td>{f.code}</td><td>{f.name}</td><td>{formatVnd(f.rate)}</td><td>{f.graceDays ?? 0}</td><td>{f.lateFeeRule || "-"}</td><td><div className="flex gap-2"><button className="btn-secondary" onClick={() => {
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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "periods")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn kỳ thu", "Period guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "Chọn đúng khoản phí cần mở kỳ.", "Choose the fee type first."),
                    l(lang, "Tháng hợp lệ từ 1-12, năm >= 2000.", "Month must be 1-12, year >= 2000."),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <div className="grid gap-2 mt-3 md:grid-cols-5">
                <div><select className="input" value={newPeriodFeeTypeId} onChange={(e) => { setNewPeriodFeeTypeId(Number(e.target.value)); clearFieldError("newPeriodFeeTypeId"); }}><option value={0}>{l(lang, "Chọn khoản phí *", "Select fee type *")}</option>{feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>{fieldErrors.newPeriodFeeTypeId && <p className="field-error">{fieldErrors.newPeriodFeeTypeId}</p>}</div>
                <div><input className="input" value={newPeriodMonth} onChange={(e) => { setNewPeriodMonth(e.target.value); clearFieldError("newPeriodMonth"); }} placeholder={l(lang, "Tháng *", "Month *")} />{fieldErrors.newPeriodMonth && <p className="field-error">{fieldErrors.newPeriodMonth}</p>}</div>
                <div><input className="input" value={newPeriodYear} onChange={(e) => { setNewPeriodYear(e.target.value); clearFieldError("newPeriodYear"); }} placeholder={l(lang, "Năm *", "Year *")} />{fieldErrors.newPeriodYear && <p className="field-error">{fieldErrors.newPeriodYear}</p>}</div>
                <select className="input" value={newPeriodStatus} onChange={(e) => setNewPeriodStatus(e.target.value as "OPEN" | "CLOSED")}>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                {editingPeriodId ? (
                  <div className="flex gap-2"><button className="btn-primary" onClick={savePeriodEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button><button className="btn-secondary" onClick={() => setEditingPeriodId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
                ) : (
                  <button className="btn-primary" onClick={addPeriod}>{t(lang, "add")}</button>
                )}
              </div>
              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc kỳ thu", "Period filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  <input className="input" value={filterPeriodQuery} onChange={(e) => setFilterPeriodQuery(e.target.value)} placeholder={l(lang, "Lọc kỳ thu theo tên/tháng/năm/trạng thái", "Filter periods by name/month/year/status")} />
                  <select className="input" value={filterPeriodStatus} onChange={(e) => setFilterPeriodStatus(e.target.value as "all" | "OPEN" | "CLOSED")}>
                    <option value="all">{l(lang, "Mọi trạng thái", "All statuses")}</option>
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                  <select className="input" value={String(filterPeriodFeeTypeId)} onChange={(e) => setFilterPeriodFeeTypeId(e.target.value === "all" ? "all" : Number(e.target.value))}>
                    <option value="all">{l(lang, "Mọi khoản phí", "All fee types")}</option>
                    {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <button className="btn-secondary" onClick={() => { setFilterPeriodQuery(""); setFilterPeriodStatus("all"); setFilterPeriodFeeTypeId("all"); }}>{l(lang, "Xóa lọc", "Clear filter")}</button>
                </div>
              </section>
              <div className="table-wrap mt-3"><table><thead><tr><th>ID</th><th>{t(lang, "name")}</th><th>{t(lang, "month")}</th><th>{t(lang, "year")}</th><th>{t(lang, "status")}</th><th>{l(lang, "Thao tác", "Actions")}</th></tr></thead><tbody>{filteredPeriods.map((p) => <tr key={p.id}><td>{p.id}</td><td>{feeTypes.find((f) => f.id === p.feeTypeId)?.name}</td><td>{p.month}</td><td>{p.year}</td><td>{p.status}</td><td><div className="flex gap-2"><button className="btn-secondary" onClick={() => {
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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "obligations")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn thu phí", "Payment collection guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "Chọn nghĩa vụ cần thu trước khi nhập số tiền.", "Choose obligation before entering amount."),
                    l(lang, "Ví dụ số tiền: 250000", "Example amount: 250000"),
                    l(lang, "Người thu là bắt buộc, người nộp có thể để trống.", "Collector is required, payer is optional."),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <div className="grid gap-3 md:grid-cols-3 mt-3">
                <select className="input" value={selectedPaymentHouseholdId} onChange={(e) => setSelectedPaymentHouseholdId(Number(e.target.value))}>
                  {households.map((h) => {
                    const outstanding = obligations
                      .filter((o) => o.householdId === h.id)
                      .reduce((s, o) => s + Math.max(0, o.amountDue - o.amountPaid), 0);
                    return <option key={h.id} value={h.id}>{h.apartmentNo} | {l(lang, "Nợ", "Debt")}: {formatVnd(outstanding)}</option>;
                  })}
                </select>
                <select className="input" value={selectedPaymentFeeTypeId} onChange={(e) => setSelectedPaymentFeeTypeId(Number(e.target.value))}>
                  <option value={0}>{l(lang, "Tất cả khoản phí", "All fee types")}</option>
                  {feeTypes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <select className="input" value={selectedObligationId} onChange={(e) => setSelectedObligationId(Number(e.target.value))}>
                  {selectablePaymentObligations.length === 0 && <option value={0}>{l(lang, "Không có khoản nợ phù hợp", "No matching outstanding obligation")}</option>}
                  {selectablePaymentObligations.map((o) => {
                    const h = households.find((x) => x.id === o.householdId);
                    const period = o.period;
                    const ft = feeTypes.find((x) => x.id === period.feeTypeId);
                    return <option key={o.id} value={o.id}>{h?.apartmentNo} | {ft?.name} | {formatVnd(o.amountDue - o.amountPaid)}</option>;
                  })}
                </select>
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-3">
                <p className="muted">{l(lang, "Tổng nợ hộ đã chọn", "Selected household debt")}: {formatVnd(paymentHouseholdOutstanding)}</p>
                <p className="muted">{l(lang, "Khoản phí", "Fee")}: {selectedObligationWithMeta?.feeType?.name ?? "-"}</p>
                <p className="muted">{l(lang, "Trễ hạn", "Overdue")}: {selectedObligationWithMeta ? `${selectedObligationWithMeta.overdueDays} ${l(lang, "ngày", "days")}` : "-"}</p>
                {fieldErrors.selectedObligationId && <p className="field-error">{fieldErrors.selectedObligationId}</p>}
                <div><input className="input" value={paymentAmount} onChange={(e) => { setPaymentAmount(e.target.value); clearFieldError("paymentAmount"); }} placeholder={l(lang, "Số tiền thu *", "Amount *")} />{fieldErrors.paymentAmount && <p className="field-error">{fieldErrors.paymentAmount}</p>}</div>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "BANK")}><option value="CASH">{t(lang, "paymentMethodCash")}</option><option value="BANK">{t(lang, "paymentMethodBank")}</option></select>
              </div>
              <div className="grid gap-2 mt-2 md:grid-cols-3">
                <div>
                  <select className="input" value={collectorName} onChange={(e) => { setCollectorName(e.target.value); clearFieldError("collectorName"); }}>
                    <option value="">{l(lang, "Chọn người thu *", "Select collector *")}</option>
                    {collectorOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  {fieldErrors.collectorName && <p className="field-error">{fieldErrors.collectorName}</p>}
                </div>
                <select className="input" value={payerName} onChange={(e) => setPayerName(e.target.value)}>
                  <option value="">{l(lang, "Chọn người nộp (tùy chọn)", "Select payer (optional)")}</option>
                  {residentPayerOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <input className="input" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder={l(lang, "SĐT người nộp", "Payer phone")} />
                <input className="input" value={bankTxRef} onChange={(e) => setBankTxRef(e.target.value)} placeholder={l(lang, "Mã GD ngân hàng", "Bank tx ref")} />
                <input className="input" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder={l(lang, "URL chứng từ", "Attachment URL")} />
                <input className="input" value={reversalNote} onChange={(e) => setReversalNote(e.target.value)} placeholder={l(lang, "Ghi chú hoàn tác", "Reversal note")} />
              </div>
              <input className="input mt-2" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder={l(lang, "Ghi chú giao dịch (tùy chọn)", "Payment note (optional)")} />
              <p className="muted mt-1">{l(lang, "Ghi chú dùng để lưu thông tin bổ sung cho giao dịch: ví dụ thanh toán đợt 1, thu bù, hoặc lý do đặc biệt.", "Note stores extra transaction context: e.g. partial payment round 1, back-charge, or special reason.")}</p>

              {editingPaymentId ? (
                <div className="flex gap-2 mt-3"><button className="btn-primary" onClick={savePaymentEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button><button className="btn-secondary" onClick={() => setEditingPaymentId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
              ) : (
                <button className="btn-primary mt-3" onClick={collectPayment}>{t(lang, "collectPayment")}</button>
              )}

              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc giao dịch", "Payment filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-5">
                  <select className="input" value={filterPaymentCollector} onChange={(e) => setFilterPaymentCollector(e.target.value)}>
                  <option value="">{l(lang, "Mọi người thu", "All collectors")}</option>
                  {collectorOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <select className="input" value={filterPaymentPayer} onChange={(e) => setFilterPaymentPayer(e.target.value)}>
                  <option value="">{l(lang, "Mọi người nộp", "All payers")}</option>
                  {payerFilterOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <select className="input" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value as "all" | "CASH" | "BANK")}>
                  <option value="all">{l(lang, "Mọi phương thức", "All methods")}</option>
                  <option value="CASH">{t(lang, "paymentMethodCash")}</option>
                  <option value="BANK">{t(lang, "paymentMethodBank")}</option>
                  </select>
                  <input className="input" type="date" value={filterPaymentFromDate} onChange={(e) => setFilterPaymentFromDate(e.target.value)} />
                  <input className="input" type="date" value={filterPaymentToDate} onChange={(e) => setFilterPaymentToDate(e.target.value)} />
                </div>
              </section>

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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "residents")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn nhân khẩu", "Resident form guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "CCCD/CMND nhập số giấy tờ định danh.", "ID No is citizen ID or legal identity number."),
                    l(lang, "Ví dụ họ tên: Phạm Thị Lan", "Example name: Jane Nguyen"),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <div className="grid gap-2 mt-3 md:grid-cols-7">
                <div><input className="input" value={newResidentName} onChange={(e) => { setNewResidentName(e.target.value); clearFieldError("newResidentName"); }} placeholder={`${t(lang, "fullName")} *`} />{fieldErrors.newResidentName && <p className="field-error">{fieldErrors.newResidentName}</p>}</div>
                <div><select className="input" value={newResidentHouseholdId} onChange={(e) => { setNewResidentHouseholdId(Number(e.target.value)); clearFieldError("newResidentHouseholdId"); }}><option value={0}>{l(lang, "Chọn căn hộ *", "Select apartment *")}</option>{households.map((h) => <option key={h.id} value={h.id}>{h.apartmentNo}</option>)}</select>{fieldErrors.newResidentHouseholdId && <p className="field-error">{fieldErrors.newResidentHouseholdId}</p>}</div>
                <div><input className="input" type="date" value={newResidentDob} onChange={(e) => { setNewResidentDob(e.target.value); clearFieldError("newResidentDob"); }} />{fieldErrors.newResidentDob && <p className="field-error">{fieldErrors.newResidentDob}</p>}</div>
                <select className="input" value={newResidentGender} onChange={(e) => setNewResidentGender(e.target.value as "MALE" | "FEMALE" | "OTHER")}><option value="MALE">{t(lang, "male")}</option><option value="FEMALE">{t(lang, "female")}</option><option value="OTHER">{t(lang, "other")}</option></select>
                <div><input className="input" value={newResidentIdNo} onChange={(e) => { setNewResidentIdNo(e.target.value); clearFieldError("newResidentIdNo"); }} placeholder={`${t(lang, "idNo")} *`} />{fieldErrors.newResidentIdNo && <p className="field-error">{fieldErrors.newResidentIdNo}</p>}</div>
                <select className="input" value={newResidentType} onChange={(e) => setNewResidentType(e.target.value as "PERMANENT" | "TEMPORARY")}><option value="PERMANENT">{t(lang, "residentPermanent")}</option><option value="TEMPORARY">{t(lang, "residentTemporary")}</option></select>
                {editingResidentId ? (
                  <div className="flex gap-2"><button className="btn-primary" onClick={saveResidentEdit}>{l(lang, "Lưu chỉnh sửa", "Save edit")}</button><button className="btn-secondary" onClick={() => setEditingResidentId(null)}>{l(lang, "Hủy", "Cancel")}</button></div>
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
              <div className="flex items-center justify-between">
                <h2 className="subtitle">{t(lang, "residencyEvents")}</h2>
                <button className="btn-secondary" onClick={() => showGuide(
                  l(lang, "Hướng dẫn biến động cư trú", "Residency event guide"),
                  [
                    l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                    l(lang, "Chọn nhân khẩu và loại biến động trước.", "Select resident and event type first."),
                    l(lang, "Ngày bắt đầu là bắt buộc, ngày kết thúc là tùy chọn.", "From date is required, to date is optional."),
                  ],
                )}>i</button>
              </div>
              <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
              <div className="grid gap-2 mt-3 md:grid-cols-6">
                <div><select className="input" value={eventResidentId} onChange={(e) => { setEventResidentId(Number(e.target.value)); clearFieldError("eventResidentId"); }}><option value={0}>{l(lang, "Chọn nhân khẩu *", "Select resident *")}</option>{residents.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}</select>{fieldErrors.eventResidentId && <p className="field-error">{fieldErrors.eventResidentId}</p>}</div>
                <select className="input" value={eventType} onChange={(e) => setEventType(e.target.value as "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT")}><option value="TEMP_RESIDENCE">{t(lang, "tempResidence")}</option><option value="TEMP_ABSENCE">{t(lang, "tempAbsence")}</option><option value="MOVE_IN">{t(lang, "moveIn")}</option><option value="MOVE_OUT">{t(lang, "moveOut")}</option></select>
                <div><input className="input" type="date" value={eventFromDate} onChange={(e) => { setEventFromDate(e.target.value); clearFieldError("eventFromDate"); }} />{fieldErrors.eventFromDate && <p className="field-error">{fieldErrors.eventFromDate}</p>}</div>
                <input className="input" type="date" value={eventToDate} onChange={(e) => setEventToDate(e.target.value)} />
                <input className="input" value={eventNote} onChange={(e) => setEventNote(e.target.value)} placeholder={t(lang, "noteField")} />
                <button className="btn-primary" onClick={saveResidencyEvent}>{t(lang, "save")}</button>
              </div>
              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc biến động", "Event filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  <input className="input" value={filterEventQuery} onChange={(e) => setFilterEventQuery(e.target.value)} placeholder={l(lang, "Lọc biến động theo người/loại/ghi chú", "Filter events by resident/type/note")} />
                  <select className="input" value={filterEventType} onChange={(e) => setFilterEventType(e.target.value as "all" | "TEMP_RESIDENCE" | "TEMP_ABSENCE" | "MOVE_IN" | "MOVE_OUT")}>
                    <option value="all">{l(lang, "Mọi loại biến động", "All event types")}</option>
                    <option value="TEMP_RESIDENCE">{t(lang, "tempResidence")}</option>
                    <option value="TEMP_ABSENCE">{t(lang, "tempAbsence")}</option>
                    <option value="MOVE_IN">{t(lang, "moveIn")}</option>
                    <option value="MOVE_OUT">{t(lang, "moveOut")}</option>
                  </select>
                  <select className="input" value={String(filterEventResidentId)} onChange={(e) => setFilterEventResidentId(e.target.value === "all" ? "all" : Number(e.target.value))}>
                    <option value="all">{l(lang, "Mọi cư dân", "All residents")}</option>
                    {residents.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                  <button className="btn-secondary" onClick={() => { setFilterEventQuery(""); setFilterEventType("all"); setFilterEventResidentId("all"); }}>{l(lang, "Xóa lọc", "Clear filter")}</button>
                </div>
              </section>
              <div className="timeline mt-3">
                {filteredEvents.slice(0, 12).map((ev) => {
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
                  <div className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Tạo người dùng", "Create user")}</h3>
                      <button className="btn-secondary" onClick={() => showGuide(
                        l(lang, "Hướng dẫn tạo người dùng", "Create user guide"),
                        [
                          l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                          l(lang, "Mật khẩu cần đủ mạnh (chữ hoa, chữ thường, số, ký tự đặc biệt).", "Password must be strong."),
                          l(lang, "Vai trò mặc định dùng cho phân quyền ban đầu.", "Default role is initial authorization."),
                        ],
                      )}>i</button>
                    </div>
                    <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
                    <div className="grid gap-2 mt-3 md:grid-cols-6">
                      <div><input className="input" value={newUserUsername} onChange={(e) => { setNewUserUsername(e.target.value); clearFieldError("newUserUsername"); }} placeholder={`${t(lang, "username")} *`} />{fieldErrors.newUserUsername && <p className="field-error">{fieldErrors.newUserUsername}</p>}</div>
                      <div><input className="input" value={newUserEmail} onChange={(e) => { setNewUserEmail(e.target.value); clearFieldError("newUserEmail"); }} placeholder={`${t(lang, "email")} *`} />{fieldErrors.newUserEmail && <p className="field-error">{fieldErrors.newUserEmail}</p>}</div>
                      <div><input className="input" value={newUserPhone} onChange={(e) => { setNewUserPhone(e.target.value); clearFieldError("newUserPhone"); }} placeholder={`${t(lang, "phone")} *`} />{fieldErrors.newUserPhone && <p className="field-error">{fieldErrors.newUserPhone}</p>}</div>
                      <div><input className="input" value={newUserFullName} onChange={(e) => { setNewUserFullName(e.target.value); clearFieldError("newUserFullName"); }} placeholder={`${t(lang, "fullName")} *`} />{fieldErrors.newUserFullName && <p className="field-error">{fieldErrors.newUserFullName}</p>}</div>
                      <select className="input" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER")}><option value="ADMIN">{t(lang, "roleAdmin")}</option><option value="ACCOUNTANT">{t(lang, "roleAccountant")}</option><option value="TEAM_LEADER">{t(lang, "roleLeader")}</option></select>
                      <div><input className="input" value={newUserPassword} onChange={(e) => { setNewUserPassword(e.target.value); clearFieldError("newUserPassword"); }} placeholder={`${t(lang, "newPassword")} *`} />{fieldErrors.newUserPassword && <p className="field-error">{fieldErrors.newUserPassword}</p>}</div>
                    </div>
                    <button className="btn-primary mt-2" onClick={createUser}>{t(lang, "create")}</button>
                  </div>

                  <div className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Tạo vai trò", "Create role")}</h3>
                      <button className="btn-secondary" onClick={() => showGuide(
                        l(lang, "Hướng dẫn tạo vai trò", "Create role guide"),
                        [
                          l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                          l(lang, "Mã vai trò viết HOA và dùng dấu gạch dưới, ví dụ: TEAM_SUPPORT", "Role code uppercase with underscore, e.g. TEAM_SUPPORT"),
                        ],
                      )}>i</button>
                    </div>
                    <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
                    <div className="grid gap-2 mt-2 md:grid-cols-3">
                      <div><input className="input" value={newRoleCode} onChange={(e) => { setNewRoleCode(e.target.value.toUpperCase()); clearFieldError("newRoleCode"); }} placeholder={`${l(lang, "Mã vai trò", "Role code")} *`} />{fieldErrors.newRoleCode && <p className="field-error">{fieldErrors.newRoleCode}</p>}</div>
                      <div><input className="input" value={newRoleName} onChange={(e) => { setNewRoleName(e.target.value); clearFieldError("newRoleName"); }} placeholder={`${l(lang, "Tên vai trò", "Role name")} *`} />{fieldErrors.newRoleName && <p className="field-error">{fieldErrors.newRoleName}</p>}</div>
                      <button className="btn-secondary" onClick={createRole}>{l(lang, "Tạo vai trò", "Create role")}</button>
                    </div>
                  </div>

                  <div className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Gán quyền cho vai trò", "Assign role permissions")}</h3>
                      <button className="btn-secondary" onClick={() => showGuide(
                        l(lang, "Hướng dẫn gán quyền vai trò", "Assign role permissions guide"),
                        [
                          l(lang, "Chọn vai trò rồi bấm các chip quyền để bật/tắt.", "Select role then toggle permission chips."),
                          l(lang, "Ví dụ: muốn xuất báo cáo thì bật REPORT_EXPORT.", "Example: enable REPORT_EXPORT for report export."),
                        ],
                      )}>i</button>
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

                  <div className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Tạo chức năng", "Create function")}</h3>
                      <button className="btn-secondary" onClick={() => showGuide(
                        l(lang, "Hướng dẫn tạo chức năng", "Create function guide"),
                        [
                          l(lang, "Các trường * là bắt buộc.", "Fields with * are required."),
                          l(lang, "Mã chức năng viết HOA, ví dụ: REPORT_EXPORT", "Permission code uppercase, e.g. REPORT_EXPORT"),
                          l(lang, "Module ví dụ: REPORT, RESIDENT, FEE", "Module examples: REPORT, RESIDENT, FEE"),
                        ],
                      )}>i</button>
                    </div>
                    <p className="muted mt-1">{l(lang, "Các trường có dấu", "Fields marked with")}{" "}<span style={{ color: "#b42318" }}>*</span>{" "}{l(lang, "là bắt buộc", "are required")}</p>
                    <div className="grid gap-2 mt-2 md:grid-cols-4">
                      <div><input className="input" value={newPermCode} onChange={(e) => { setNewPermCode(e.target.value.toUpperCase()); clearFieldError("newPermCode"); }} placeholder={`${l(lang, "Mã chức năng", "Function code")} *`} />{fieldErrors.newPermCode && <p className="field-error">{fieldErrors.newPermCode}</p>}</div>
                      <div><input className="input" value={newPermName} onChange={(e) => { setNewPermName(e.target.value); clearFieldError("newPermName"); }} placeholder={`${l(lang, "Tên chức năng", "Function name")} *`} />{fieldErrors.newPermName && <p className="field-error">{fieldErrors.newPermName}</p>}</div>
                      <div><input className="input" value={newPermModule} onChange={(e) => { setNewPermModule(e.target.value.toUpperCase()); clearFieldError("newPermModule"); }} placeholder={`${l(lang, "Module", "Module")} *`} />{fieldErrors.newPermModule && <p className="field-error">{fieldErrors.newPermModule}</p>}</div>
                      <button className="btn-secondary" onClick={createPermission}>{l(lang, "Tạo chức năng", "Create function")}</button>
                    </div>
                  </div>

                  <div className="card mt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="subtitle">{l(lang, "Gán vai trò cho người dùng", "Assign user roles")}</h3>
                      <button className="btn-secondary" onClick={() => showGuide(
                        l(lang, "Hướng dẫn gán vai trò", "Assign user roles guide"),
                        [
                          l(lang, "Chọn người dùng, sau đó chọn 1 hoặc nhiều vai trò.", "Select user then choose one or more roles."),
                          l(lang, "Bấm Lưu để áp dụng thay đổi.", "Click Save to apply changes."),
                        ],
                      )}>i</button>
                    </div>
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
                </>
              )}
              <section className="card mt-3">
                <h3 className="subtitle">{l(lang, "Bộ lọc người dùng", "User filters")}</h3>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  <input className="input" value={filterUserQuery} onChange={(e) => setFilterUserQuery(e.target.value)} placeholder={l(lang, "Lọc người dùng theo tài khoản/tên/vai trò", "Filter users by username/name/role")} />
                  <select className="input" value={filterUserRole} onChange={(e) => setFilterUserRole(e.target.value as "all" | "ADMIN" | "ACCOUNTANT" | "TEAM_LEADER")}>
                    <option value="all">{l(lang, "Mọi vai trò", "All roles")}</option>
                    <option value="ADMIN">{t(lang, "roleAdmin")}</option>
                    <option value="ACCOUNTANT">{t(lang, "roleAccountant")}</option>
                    <option value="TEAM_LEADER">{t(lang, "roleLeader")}</option>
                  </select>
                  <select className="input" value={filterUserStatus} onChange={(e) => setFilterUserStatus(e.target.value as "all" | "ACTIVE" | "BLOCKED")}>
                    <option value="all">{l(lang, "Mọi trạng thái", "All statuses")}</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                  <button className="btn-secondary" onClick={() => { setFilterUserQuery(""); setFilterUserRole("all"); setFilterUserStatus("all"); }}>{l(lang, "Xóa lọc", "Clear filter")}</button>
                </div>
              </section>
              <div className="table-wrap mt-3"><table><thead><tr><th>{t(lang, "username")}</th><th>{t(lang, "fullName")}</th><th>{t(lang, "role")}</th><th>{t(lang, "status")}</th></tr></thead><tbody>{filteredUsers.map((u) => <tr key={u.id}><td>{u.username}</td><td>{u.fullName}</td><td>{u.role}</td><td>{u.status}</td></tr>)}</tbody></table></div>
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
                        {showPaymentColumns.note && <th>{l(lang, "Ghi chú", "Note")}</th>}
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
                            {showPaymentColumns.note && <td>{p.note || "-"}</td>}
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
      <HelpModal open={helpModal.open} title={helpModal.title} lines={helpModal.lines} onClose={() => setHelpModal({ open: false, title: "", lines: [] })} />
    </main>
  );
}
