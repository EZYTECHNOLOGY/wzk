"use client";

import { useCallback, useEffect, useState } from "react";
import PayPalCheckout from "@/components/PayPalCheckout";
import { useLang } from "@/components/LangProvider";
import { deskCopy, localeOf, say } from "@/lib/desk-copy";

type Status = {
  access: "trial" | "paid" | "expired";
  limits: { links: number; numbers: number };
  trialEndsAt: string;
  paidUntil: string | null;
  remaining: number;
  paypal: boolean;
};

export default function PlanPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].plan;
  const [status, setStatus] = useState<Status | null>(null);
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; percentOff: number; amount: string; currency: string; free: boolean } | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    fetch("/api/plan").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  const onPaid = useCallback((until: string) => setPaidUntil(until), []);
  const access = paidUntil ? "paid" : status?.access;
  const date = (value: string) => new Date(value).toLocaleDateString(localeOf(lang));

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{access === "expired" ? t.mustBuy : t.lede}</p>
      <section className="grid-2" style={{ marginTop: 18 }}>
        <article className="card">
          <p className="eyebrow">{t.trial}</p>
          <h2>{t.trialHead}</h2>
          <ul>
            {t.trialItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="muted">{access === "trial" ? t.current(status ? date(status.trialEndsAt) : "") : access === "paid" ? t.over : t.ended}</p>
        </article>
        <article className="card price-on">
          <p className="eyebrow">Agency</p>
          <h2>{applied ? (applied.currency === "ILS" ? `${applied.amount} ₪` : `${applied.amount} USD`) : lang === "he" ? "49 ₪" : "18 USD"}</h2>
          {applied && <p className="muted">{t.couponOff(applied.percentOff)}</p>}
          <p className="muted">{t.seats(status?.remaining ?? "—")}</p>
          <ul>{t.agencyItems.map((item) => <li key={item}>{item}</li>)}</ul>
          {access === "paid" ? (
            <p>{t.paidThrough(date(paidUntil || status?.paidUntil || ""))}</p>
          ) : (
            <>
              <form
                className="coupon-box"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCouponError("");
                  const res = await fetch("/api/coupon", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, currency: lang === "he" ? "ILS" : "USD" }),
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setApplied(null);
                    setCouponError(say(lang, json.error || "That coupon is not valid."));
                    return;
                  }
                  setApplied(json);
                }}
              >
                <input className="field ltr" dir="ltr" value={code} placeholder={t.coupon} onChange={(e) => setCode(e.target.value)} />
                <button className="btn coupon-apply" type="submit">{t.couponApply}</button>
              </form>
              {couponError && <p style={{ color: "var(--danger)" }}>{couponError}</p>}
              {applied?.free ? (
                <>
                  <p className="muted">{t.couponFree}</p>
                  <button
                    className="btn coupon-apply"
                    type="button"
                    onClick={async () => {
                      setCouponError("");
                      const res = await fetch("/api/paypal/order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ currency: applied.currency, code: applied.code }),
                      });
                      const json = await res.json();
                      if (!res.ok || !json.paidUntil) {
                        setCouponError(say(lang, json.error || "That coupon is not valid."));
                        return;
                      }
                      onPaid(json.paidUntil);
                    }}
                  >
                    {t.couponUse}
                  </button>
                </>
              ) : (
                <PayPalCheckout currency={lang === "he" ? "ILS" : "USD"} code={applied?.code ?? ""} onPaid={onPaid} />
              )}
            </>
          )}
        </article>
      </section>
    </>
  );
}
