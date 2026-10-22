"use client";

import Link from "next/link";
import { useState } from "react";
import PayPalCheckout from "@/components/PayPalCheckout";
import { deskCopy, say } from "@/lib/desk-copy";
import type { Lang } from "@/lib/home-copy";

type Applied = { code: string; percentOff: number; amount: string; currency: "ILS" | "USD"; free: boolean };

export default function PayGuest({ initialLang, failed }: { initialLang: Lang; failed?: boolean }) {
  const [lang] = useState<Lang>(initialLang);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [couponError, setCouponError] = useState("");
  const [readyEmail, setReadyEmail] = useState("");
  const [done, setDone] = useState("");
  const he = lang === "he";
  const currency = he ? "ILS" : "USD";
  const t = deskCopy[lang].plan;

  async function applyCoupon() {
    setCouponError("");
    const res = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, currency }),
    });
    const json = await res.json();
    if (!res.ok) {
      setApplied(null);
      setCouponError(say(lang, json.error || "That coupon is not valid."));
      return;
    }
    setApplied(json);
  }

  async function redeemFree() {
    setCouponError("");
    const account = email.trim().toLowerCase();
    if (!account || !applied) return;
    const res = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: applied.currency, code: applied.code, email: account }),
    });
    const json = await res.json();
    if (!res.ok || !json.paidUntil) {
      setCouponError(say(lang, json.error || "That coupon is not valid."));
      return;
    }
    setDone(json.paidUntil);
  }

  return (
    <div className="storefront min-h-dvh bg-paper px-4 py-10 text-ink">
      <div className="mx-auto grid max-w-lg gap-6">
        <Link href="/" className="font-display text-sm font-black">WZK</Link>
        <section className="wzk-block bg-klik p-6 md:p-8">
          <h1 className="wzk-display text-4xl">{he ? "שלוש שנים. בלי מנוי." : "Three years. No subscription."}</h1>
          <p className="mt-3 text-base font-bold">
            {he
              ? "רושמים את האימייל של החשבון. גם בלי להיות מחוברים, התשלום פותח את הדסק לשלוש שנים."
              : "Use the email on the account. Even signed out, the payment opens the desk for three years."}
          </p>
          <p className="mt-2 text-base font-bold">{he ? "49 ש״ח פעם אחת." : "18 USD once."}</p>
          {failed && <p className="mt-3 font-bold" style={{ color: "#9a1230" }}>{he ? "התשלום לא נקלט. נסו שוב." : "The payment was not applied. Try again."}</p>}
          {done ? (
            <p className="mt-6 text-base font-bold">
              {he ? `הדסק פתוח עד ${new Date(done).toLocaleDateString("he-IL")}. ` : `The desk is open until ${new Date(done).toLocaleDateString("en-US")}. `}
              <Link href="/login?paid=1" className="underline">{he ? "לכניסה" : "Log in"}</Link>
            </p>
          ) : (
            <form
              className="mt-6 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setReadyEmail(email.trim().toLowerCase());
              }}
            >
              <label className="grid gap-2 text-sm font-bold">
                {he ? "אימייל החשבון" : "Account email"}
                <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                {t.coupon}
                <input className="field" dir="ltr" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" />
              </label>
              <button className="btn" type="button" onClick={() => applyCoupon().catch(() => setCouponError(say(lang, "That coupon is not valid.")))}>{t.couponApply}</button>
              {couponError && <p className="font-bold" style={{ color: "#9a1230" }}>{couponError}</p>}
              {applied && <p className="font-bold">{t.couponOff(applied.percentOff)} · {applied.currency === "ILS" ? `${applied.amount} ₪` : `${applied.amount} USD`}</p>}
              {applied?.free ? (
                <button className="btn" type="button" onClick={() => redeemFree().catch(() => setCouponError(say(lang, "That coupon is not valid.")))}>{t.couponUse}</button>
              ) : (
                <button className="btn" type="submit">{he ? "להמשיך לתשלום" : "Continue to payment"}</button>
              )}
            </form>
          )}
          {readyEmail && !done && !applied?.free && (
            <div className="mt-4">
              <PayPalCheckout key={`${readyEmail}:${applied?.code ?? ""}`} currency={currency} email={readyEmail} code={applied?.code ?? ""} lang={lang} onPaid={setDone} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
