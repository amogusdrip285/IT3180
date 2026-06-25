"use client";

import { LanguageSwitch } from "@/components/LanguageSwitch";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const BLUE = "#0f5fdf";

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
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(18px)",
          borderRadius: "1.25rem",
          border: "1px solid rgba(207,217,232,0.5)",
          boxShadow: "0 2px 8px rgba(14,60,122,0.04), 0 16px 40px -20px rgba(14,60,122,0.3)",
          padding: "2.25rem 2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", marginBottom: "0.2rem" }}>
              <span style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: BLUE,
                marginRight: "0.15rem",
              }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BLUE }}>BlueMoon</span>
            </div>
            <h1 style={{ margin: "0.15rem 0 0", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--foreground)" }}>
              {t(lang, "login")}
            </h1>
          </div>
          <LanguageSwitch lang={lang} onChange={onChangeLang} label={t(lang, "language")} />
        </div>

        <div style={{
          display: "flex",
          gap: "0.2rem",
          marginBottom: "1.5rem",
          background: "rgba(240,246,255,0.5)",
          borderRadius: "0.6rem",
          padding: "0.2rem",
        }}>
          <button
            onClick={() => setAuthMode("login")}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              color: authMode === "login" ? BLUE : "var(--muted)",
              background: authMode === "login" ? "#fff" : "transparent",
              boxShadow: authMode === "login" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {l(lang, "Đăng nhập", "Sign In")}
          </button>
          <button
            onClick={() => setAuthMode("signup")}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              color: authMode === "signup" ? BLUE : "var(--muted)",
              background: authMode === "signup" ? "#fff" : "transparent",
              boxShadow: authMode === "signup" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {l(lang, "Đăng ký", "Sign Up")}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (authMode === "login") {
              onLogin(new FormData(e.currentTarget));
            } else {
              onSignup();
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
        >
          {authMode === "login" ? (
            <>
              <input name="username" className="input" placeholder={t(lang, "loginAsEmailOrUsername")} />
              <input name="password" className="input" type="password" placeholder={t(lang, "password")} />
              {loginError && <p className="error-text" style={{ textAlign: "center" }}>{loginError}</p>}
              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "0.7rem", marginTop: "0.25rem" }}>
                {t(lang, "signIn")}
              </button>
              <p style={{ textAlign: "center", margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                {l(lang, "Chưa có tài khoản?", "No account yet?")}{" "}
                <button type="button" onClick={() => setAuthMode("signup")} style={{
                  border: "none", background: "none", color: BLUE,
                  cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                  padding: 0, textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}>
                  {l(lang, "Đăng ký quản trị viên", "Admin signup")}
                </button>
              </p>
            </>
          ) : (
            <>
              <input className="input" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} placeholder={t(lang, "username")} />
              <input className="input" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder={t(lang, "email")} />
              <input className="input" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder={t(lang, "phone")} />
              <input className="input" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} placeholder={t(lang, "fullName")} />
              <input className="input" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder={t(lang, "newPassword")} />
              {loginError && <p className="error-text" style={{ textAlign: "center" }}>{loginError}</p>}
              <button type="button" className="btn-primary" style={{ width: "100%", padding: "0.7rem", marginTop: "0.25rem" }} onClick={onSignup}>
                {l(lang, "Tạo tài khoản quản trị viên", "Create admin account")}
              </button>
              <p style={{ textAlign: "center", margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                {l(lang, "Đã có tài khoản?", "Already have an account?")}{" "}
                <button type="button" onClick={() => setAuthMode("login")} style={{
                  border: "none", background: "none", color: BLUE,
                  cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                  padding: 0, textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}>
                  {l(lang, "Quay lại đăng nhập", "Back to login")}
                </button>
              </p>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
