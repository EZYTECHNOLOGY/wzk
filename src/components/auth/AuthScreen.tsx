"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/home-copy";

const copy = {
  he: {
    back: "חזרה ל־Wzk.io",
    other: "English",
    loginKicker: "הדסק של העסק",
    loginTitle: "שלום",
    loginAccent: "שוב.",
    loginBody: "נכנסים כדי שהקליק הבא יגיע לאדם הנכון.",
    signupKicker: "שבוע ניסיון",
    signupTitle: "פותחים",
    signupAccent: "דסק.",
    signupBody: "שלושה קישורים וחמישה מושבים, לשבוע. בלי כרטיס.",
    email: "אימייל",
    password: "סיסמה",
    name: "השם שלך",
    workspace: "שם הצוות",
    loginBtn: "כניסה",
    signupBtn: "יוצרים את הדסק",
    working: "רגע…",
    noAccount: "אין חשבון?",
    signupFree: "נרשמים בחינם",
    haveAccount: "כבר יש דסק?",
    toLogin: "כניסה",
    asideLoginKicker: "עוד אין דסק?",
    asideLoginTitle: "כל קליק מקבל תור.",
    asideLoginBody: "קישור אחד. האדם הבא. השיחה נשארת בטלפון.",
    asideLoginCta: "יוצרים חשבון",
    asideSignupKicker: "כבר בפנים?",
    asideSignupTitle: "הדסק מחכה.",
    asideSignupBody: "נכנסים עם אותו אימייל וסיסמה.",
    asideSignupCta: "לכניסה",
    chip1: "דסק משלכם",
    chip2: "שבוע ניסיון",
    chip3: "בלי כרטיס",
    stageTitle: "קישור אחד. תור הוגן.",
    stageBody: "נבנה לכל הצוות.",
  },
  en: {
    back: "Back to Wzk.io",
    other: "עברית",
    loginKicker: "Your business desk",
    loginTitle: "Welcome",
    loginAccent: "back.",
    loginBody: "Sign in so the next klik reaches the right person.",
    signupKicker: "One trial week",
    signupTitle: "Open a",
    signupAccent: "desk.",
    signupBody: "Three links and five seats, for a week. No card.",
    email: "Email",
    password: "Password",
    name: "Your name",
    workspace: "Team name",
    loginBtn: "Log in",
    signupBtn: "Create the desk",
    working: "One moment…",
    noAccount: "No account?",
    signupFree: "Sign up free",
    haveAccount: "Already have a desk?",
    toLogin: "Log in",
    asideLoginKicker: "New here?",
    asideLoginTitle: "Every klik gets a turn.",
    asideLoginBody: "One link. The next person. The chat stays on the phone.",
    asideLoginCta: "Create an account",
    asideSignupKicker: "Already in?",
    asideSignupTitle: "The desk is waiting.",
    asideSignupBody: "Use the same email and password.",
    asideSignupCta: "Log in",
    chip1: "Your own desk",
    chip2: "7-day trial",
    chip3: "No card",
    stageTitle: "One link. A fair turn.",
    stageBody: "Built for the whole desk.",
  },
} as const;

export default function AuthScreen({
  mode,
  initialLang,
}: {
  mode: "login" | "signup";
  initialLang: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = copy[lang];

  function switchLang() {
    const next: Lang = lang === "he" ? "en" : "he";
    document.cookie = `wzk_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
    setLang(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { email: data.get("email"), password: data.get("password") }
        : {
            name: data.get("name"),
            workspace: data.get("workspace"),
            email: data.get("email"),
            password: data.get("password"),
          };
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const raw = json.error || "";
      const he: Record<string, string> = {
        "Wrong email or password.": "האימייל או הסיסמה לא נכונים.",
        "That email already has an account.": "לאימייל הזה כבר יש חשבון.",
        "Check the form and use at least 8 characters.": "בדקו את הטופס. הסיסמה לפחות 8 תווים.",
        "Email and password are required.": "צריך אימייל וסיסמה.",
        "This account is paused.": "החשבון הזה מושהה.",
      };
      return setError(lang === "he" ? he[raw] || raw || "לא הצלחנו" : raw || "Something went wrong");
    }
    window.location.href = "/dashboard";
  }

  const aside = mode === "login";

  return (
    <div className="auth">
      <div className="auth-top">
        <Link href="/" className="btn ghost">{t.back}</Link>
        <button type="button" className="lang-switch" onClick={switchLang}>{t.other}</button>
        <Link href="/" className="brand">
          <span className="brand-mark">Wzk.io</span>
        </Link>
      </div>
      <section className="auth-card">
        <form className="auth-form" onSubmit={onSubmit}>
          <p className="eyebrow">{mode === "login" ? t.loginKicker : t.signupKicker}</p>
          <h1>{mode === "login" ? t.loginTitle : t.signupTitle} <em>{mode === "login" ? t.loginAccent : t.signupAccent}</em></h1>
          <p className="lede">{mode === "login" ? t.loginBody : t.signupBody}</p>
          {mode === "signup" && (
            <>
              <label>{t.name}<input name="name" required className="field" autoComplete="name" /></label>
              <label>{t.workspace}<input name="workspace" required className="field" /></label>
            </>
          )}
          <label>{t.email}<input name="email" type="email" required className="field" autoComplete="email" placeholder="you@example.com" /></label>
          <label>{t.password}<input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
          <button className="btn home-cta" disabled={busy}>{busy ? t.working : mode === "login" ? t.loginBtn : t.signupBtn}</button>
          <p className="muted" style={{ margin: 0 }}>
            {mode === "login" ? t.noAccount : t.haveAccount}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? t.signupFree : t.toLogin}</Link>
          </p>
        </form>
        <aside className="auth-aside">
          <p className="eyebrow">{aside ? t.asideLoginKicker : t.asideSignupKicker}</p>
          <h2>{aside ? t.asideLoginTitle : t.asideSignupTitle}</h2>
          <p>{aside ? t.asideLoginBody : t.asideSignupBody}</p>
          <Link href={aside ? "/signup" : "/login"} className="btn ghost" style={{ width: "fit-content" }}>
            {aside ? t.asideLoginCta : t.asideSignupCta}
          </Link>
          <div className="stage" aria-hidden>
            <svg className="stage-wires" viewBox="0 0 320 260">
              <path d="M160 132 C150 78 78 62 52 48" />
              <path d="M160 132 C170 78 246 62 272 48" />
              <path d="M160 148 C160 188 228 196 250 168" />
            </svg>
            <span className="sat sat-a" />
            <span className="sat sat-b" />
            <span className="sat sat-c" />
            <div className="core">
              <span className="core-ring" />
              <span className="core-ring delay" />
              <div className="lock-bubble">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#e9fff3" strokeWidth="1.7">
                  <rect x="5" y="11" width="14" height="10" rx="2.5" fill="rgba(4,18,10,0.35)" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.2" fill="#e9fff3" stroke="none" />
                </svg>
              </div>
            </div>
            <div className="pedestal">
              <i />
              <b />
            </div>
            <p className="stage-card" style={{ direction: lang === "he" ? "rtl" : "ltr" }}>
              <strong>{t.stageTitle}</strong>
              <span>{t.stageBody}</span>
            </p>
          </div>
        </aside>
      </section>
      <p className="auth-chips">
        <span>{t.chip1}</span>
        <span>{t.chip2}</span>
        <span>{t.chip3}</span>
      </p>
    </div>
  );
}
