import type { User } from "@/lib/types";

export function canPermission(user: User | null, module: "SYSTEM" | "FEE" | "RESIDENT" | "REPORT" | "VEHICLE", action: "READ" | "WRITE" | "ADMIN" | "LOG"): boolean {
  if (!user) return false;
  const roleCodes = user.roleCodes ?? [user.role];
  if (roleCodes.includes("ADMIN")) return true;
  const permissionCodes = user.permissionCodes ?? [];
  const direct = `${module}_${action}`;
  const broad = `${module}_ADMIN`;
  return permissionCodes.includes(direct) || permissionCodes.includes(broad);
}
