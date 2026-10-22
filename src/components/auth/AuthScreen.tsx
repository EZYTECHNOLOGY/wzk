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
    passwordAgain: "סיסמה שוב",
    mismatch: "הסיסמאות לא זהות.",
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
    passwordAgain: "Re-enter password",
    mismatch: "Passwords do not match.",
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
  paid = false,
}: {
  mode: "login" | "signup";
  initialLang: Lang;
  paid?: boolean;
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
    if (mode === "signup" && data.get("password") !== data.get("passwordConfirm")) {
      setBusy(false);
      return setError(t.mismatch);
    }
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { email: data.get("email"), password: data.get("password") }
        : {
            name: data.get("name"),
            workspace: data.get("workspace"),
            email: data.get("email"),
            password: data.get("password"),
            passwordConfirm: data.get("passwordConfirm"),
            lang,
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
        "Passwords do not match.": "הסיסמאות לא זהות.",
        "This account is paused.": "החשבון הזה מושהה.",
      };
      return setError(lang === "he" ? he[raw] || raw || "לא הצלחנו" : raw || "Something went wrong");
    }
    window.location.href = "/dashboard";
  }

  const login = mode === "login";
  const pictures = login
    ? [
        { src: "/assets/hero.jpg", alt: t.stageTitle, className: "col-span-2 row-span-2" },
        { src: "/assets/desk.jpg", alt: t.asideLoginTitle, className: "" },
      ]
    : [
        { src: "/assets/desk.jpg", alt: t.stageTitle, className: "col-span-2" },
        { src: "/assets/hero.jpg", alt: t.asideSignupTitle, className: "" },
      ];

  return (
    <div className="storefront wzk-halftone min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-grid h-10 w-14 place-items-center rounded-brand border-[3px] border-ink bg-klik font-display text-base font-black text-ink shadow-[3px_3px_0_0_#ff7ac6]">WZK</Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden text-sm font-bold underline decoration-[#ff7ac6] decoration-[3px] underline-offset-4 sm:inline">{t.back}</Link>
          <button type="button" onClick={switchLang} className="inline-flex h-10 items-center rounded-full border-[3px] border-ink bg-card px-3 font-display text-sm font-black shadow-[3px_3px_0_0_#ff7ac6]">
            {lang === "he" ? "EN" : "עב"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2">
        <section className={`wzk-block p-5 sm:p-8 ${login ? "bg-klik" : "bg-sun"}`}>
          <span className="inline-block -rotate-2 rounded-full border-[3px] border-ink bg-sticker px-3 py-1 font-display text-xs font-black shadow-[3px_3px_0_0_#141414]">
            {login ? t.loginKicker : t.signupKicker}
          </span>
          <h1 className="wzk-display mt-4 text-5xl sm:text-6xl">
            {login ? t.loginTitle : t.signupTitle}{" "}
            <span className="inline-block -rotate-1 rounded-md bg-ink px-2 text-paper">{login ? t.loginAccent : t.signupAccent}</span>
          </h1>
          <p className="mt-4 max-w-[42ch] text-base font-bold">
            {paid ? (lang === "he" ? "התשלום נקלט. נכנסים והדסק פתוח לשלוש שנים." : "Payment received. Sign in and the desk is open for three years.") : login ? t.loginBody : t.signupBody}
          </p>
          <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
            {mode === "signup" && (
              <>
                <label className="grid gap-1 text-sm font-bold">{t.name}<input name="name" required className="field" autoComplete="name" /></label>
                <label className="grid gap-1 text-sm font-bold">{t.workspace}<input name="workspace" required className="field" /></label>
              </>
            )}
            <label className="grid gap-1 text-sm font-bold">{t.email}<input name="email" type="email" required className="field" autoComplete="email" placeholder="you@example.com" /></label>
            <label className="grid gap-1 text-sm font-bold">{t.password}<input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
            {mode === "signup" && (
              <label className="grid gap-1 text-sm font-bold">{t.passwordAgain}<input name="passwordConfirm" type="password" required minLength={8} className="field" autoComplete="new-password" /></label>
            )}
            {error && <p className="font-bold" style={{ color: "#9a1230", margin: 0 }}>{error}</p>}
            <button type="submit" className="btn mt-1" disabled={busy}>{busy ? t.working : login ? t.loginBtn : t.signupBtn}</button>
          </form>
          <p className="mt-4 text-sm font-bold">
            {login ? t.noAccount : t.haveAccount}{" "}
            <Link href={login ? "/signup" : "/login"} className="underline decoration-[#ff7ac6] decoration-[3px] underline-offset-4">{login ? t.signupFree : t.toLogin}</Link>
          </p>
        </section>

        <aside className="grid gap-4">
          <div className={`wzk-block grid gap-3 p-3 ${login ? "bg-sky" : "bg-klik"}`}>
            <div className="grid grid-cols-2 gap-3">
              {pictures.map((picture) => (
                <div key={picture.src} className={`wzk-block-sm overflow-hidden bg-card ${picture.className}`}>
                  <img src={picture.src} alt={picture.alt} className="block h-full max-h-[340px] w-full object-cover" />
                </div>
              ))}
              <div className="wzk-block-sm flex flex-col justify-between bg-card p-4">
                <span className="inline-block w-fit rotate-2 rounded-full border-[3px] border-ink bg-sticker px-3 py-1 font-display text-xs font-black">{login ? t.chip2 : t.chip3}</span>
                <div>
                  <h2 className="wzk-display mt-3 text-3xl">{login ? t.asideLoginTitle : t.asideSignupTitle}</h2>
                  <p className="mt-2 text-sm font-bold">{login ? t.asideLoginBody : t.asideSignupBody}</p>
                </div>
                <Link href={login ? "/signup" : "/login"} className="btn mt-4" style={{ width: "fit-content" }}>{login ? t.asideLoginCta : t.asideSignupCta}</Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className={`grid place-items-center rounded-brand border-[3px] border-ink p-2 shadow-[3px_3px_0_0_#141414] ${index % 4 === 0 ? "bg-sticker" : index % 3 === 0 ? "bg-sun" : "bg-card"}`}>
                <img src={`/assets/icons/icon-${index}.png`} alt="" width={64} height={64} className="h-14 w-14 object-contain" />
              </div>
            ))}
          </div>
          <p className="text-sm font-bold">{t.chip1} · {t.chip2} · {t.chip3}</p>
        </aside>
      </main>
    </div>
  );
}
