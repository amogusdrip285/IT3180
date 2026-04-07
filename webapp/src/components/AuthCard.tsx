"use client";

import { LanguageSwitch } from "@/components/LanguageSwitch";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function AuthCard({
  lang,
  onChangeLang,
  loginError,
  authMode,
  setAuthMode,
  signupUsername,
  setSignupUsername,
  signupEmail,
  setSignupEmail,
  signupPhone,
  setSignupPhone,
  signupFullName,
  setSignupFullName,
  signupPassword,
  setSignupPassword,
  onSignup,
  onLogin,
  l,
}: {
  lang: Lang;
  onChangeLang: (lang: Lang) => void;
  loginError: string;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
  signupUsername: string;
  setSignupUsername: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPhone: string;
  setSignupPhone: (value: string) => void;
  signupFullName: string;
  setSignupFullName: (value: string) => void;
  signupPassword: string;
  setSignupPassword: (value: string) => void;
  onSignup: () => void;
  onLogin: (formData: FormData) => void;
  l: (lang: Lang, vi: string, en: string) => string;
}) {
  return (
    <main className="page-center">
      <section className="card w-full max-w-md">
        <div className="flex justify-between items-center gap-2">
          <div>
            <p className="eyebrow">BlueMoon</p>
            <h1 className="title">{t(lang, "login")}</h1>
          </div>
          <LanguageSwitch lang={lang} onChange={onChangeLang} label={t(lang, "language")} />
        </div>
        <form
          className="space-y-3 mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (authMode === "login") {
              onLogin(new FormData(e.currentTarget));
            } else {
              onSignup();
            }
          }}
        >
          {authMode === "login" ? (
            <>
              <input name="username" className="input" placeholder={t(lang, "loginAsEmailOrUsername")} />
              <input name="password" className="input" type="password" placeholder={t(lang, "password")} />
              {loginError && <p className="error-text">{loginError}</p>}
              <button type="submit" className="btn-primary w-full">{t(lang, "signIn")}</button>
              <button type="button" className="btn-secondary w-full" onClick={() => setAuthMode("signup")}>{l(lang, "Đăng ký quản trị viên", "Admin signup")}</button>
            </>
          ) : (
            <>
              <input className="input" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} placeholder={t(lang, "username")} />
              <input className="input" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder={t(lang, "email")} />
              <input className="input" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder={t(lang, "phone")} />
              <input className="input" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} placeholder={t(lang, "fullName")} />
              <input className="input" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder={t(lang, "newPassword")} />
              {loginError && <p className="error-text">{loginError}</p>}
              <button type="button" className="btn-primary w-full" onClick={onSignup}>{l(lang, "Tạo tài khoản quản trị viên", "Create admin account")}</button>
              <button type="button" className="btn-secondary w-full" onClick={() => setAuthMode("login")}>{l(lang, "Quay lại đăng nhập", "Back to login")}</button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
