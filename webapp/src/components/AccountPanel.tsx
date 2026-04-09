"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Lang, User } from "@/lib/types";

export function AccountPanel({
  user,
  lang,
  profileFullName,
  setProfileFullName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  oldPassword,
  setOldPassword,
  newPasswordSelf,
  setNewPasswordSelf,
  setUser,
  changePasswordSelf,
  refreshAllFromApi,
  l,
}: {
  user: User;
  lang: Lang;
  profileFullName: string;
  setProfileFullName: (v: string) => void;
  profileEmail: string;
  setProfileEmail: (v: string) => void;
  profilePhone: string;
  setProfilePhone: (v: string) => void;
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPasswordSelf: string;
  setNewPasswordSelf: (v: string) => void;
  setUser: Dispatch<SetStateAction<User | null>>;
  changePasswordSelf: () => void;
  refreshAllFromApi: () => Promise<void>;
  l: (lang: Lang, vi: string, en: string) => string;
}) {
  return (
    <section className="card">
      <h2 className="subtitle">{l(lang, "Tài khoản cá nhân", "My account")}</h2>
      <div className="grid gap-4 mt-3 md:grid-cols-[160px,1fr] items-start">
        <div className="card">
          <div style={{ width: 120, height: 120, borderRadius: "999px", overflow: "hidden", border: "1px solid #d0def4", margin: "0 auto" }}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#f0f6ff", color: "#244f8f", fontWeight: 700, fontSize: 28 }}>
                {(user.fullName || user.username).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <p className="muted mt-2 text-center">{user.username}</p>
          <p className="muted text-center">{user.role}</p>
        </div>

        <div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="input" value={profileFullName} onChange={(e) => setProfileFullName(e.target.value)} placeholder={l(lang, "Họ và tên", "Full name")} />
            <input className="input" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder={l(lang, "Email", "Email")} />
            <input className="input" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder={l(lang, "So dien thoai", "Phone")} />
            <input className="input md:col-span-2" value={user.address ?? ""} onChange={(e) => setUser((prev) => (prev ? { ...prev, address: e.target.value } : prev))} placeholder={l(lang, "Địa chỉ", "Address")} />
          </div>
          <button
            className="btn-secondary mt-2"
            onClick={() => {
              void fetch(`/api/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: profileFullName,
                  email: profileEmail,
                  phone: profilePhone,
                  address: user.address ?? "",
                }),
              }).then(async () => {
                await refreshAllFromApi();
              });
            }}
          >
            {l(lang, "Cập nhật hồ sơ", "Update profile")}
          </button>

          <h3 className="subtitle mt-4">{l(lang, "Đổi mật khẩu", "Change password")}</h3>
          <div className="grid gap-2 md:grid-cols-3 mt-2">
            <input className="input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={l(lang, "Mật khẩu hiện tại", "Current password")} />
            <input className="input" type="password" value={newPasswordSelf} onChange={(e) => setNewPasswordSelf(e.target.value)} placeholder={l(lang, "Mật khẩu mới", "New password")} />
            <button className="btn-secondary" onClick={changePasswordSelf}>{l(lang, "Đổi mật khẩu", "Change password")}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
