"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, localeOf, say } from "@/lib/desk-copy";

type PaymentRow = { id: string; amount: string; currency: string; status: string; createdAt: string; workspace: { name: string } };
type Seat = {
  id: string;
  role: string;
  workspace: string;
  access: "trial" | "paid" | "expired";
  trialEndsAt: string | null;
  paidUntil: string | null;
  payment: { amount: string; currency: string; status: string; createdAt: string } | null;
};
type Person = { id: string; name: string; email: string; paused: boolean; self: boolean; workspaces: Seat[] };
type CouponRow = { id: string; code: string; percentOff: number; maxUses: number | null; usedCount: number; expiresAt: string | null; active: boolean };

type Payload = {
  stock: { remaining: number };
  payments: PaymentRow[];
  tickets: { id: string; email: string; message: string; priority: boolean; createdAt: string; workspace: { name: string } }[];
  people: Person[];
  coupons: CouponRow[];
  error?: string;
};

export default function AdminPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].admin;
  const [data, setData] = useState<Payload | null>(null);
  const [remaining, setRemaining] = useState("");
  const [error, setError] = useState("");
  const [paypalEnv, setPaypalEnv] = useState<"sandbox" | "live">("sandbox");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [cardEnabled, setCardEnabled] = useState(true);
  const [secretSet, setSecretSet] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [percentOff, setPercentOff] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [confirmEmail, setConfirmEmail] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin");
    const json = await res.json();
    if (!res.ok) return setError(say(lang, json.error || "Admin only"));
    setData(json);
    setRemaining(String(json.stock.remaining));
    const paypal = await fetch("/api/admin/paypal").then((r) => r.json());
    if (paypal.env === "live" || paypal.env === "sandbox") {
      setPaypalEnv(paypal.env);
      setClientId(paypal.clientId || "");
      setCardEnabled(paypal.cardEnabled !== false);
      setSecretSet(Boolean(paypal.secretSet));
      setPaypalReady(Boolean(paypal.ready));
    }
  }
  useEffect(() => {
    setError("");
    load().catch(() => setError(say(lang, "Could not load admin")));
  }, [lang]);

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!data) return <p className="muted">{t.loading}</p>;

  function when(value: string | null) {
    return value ? new Date(value).toLocaleString(localeOf(lang)) : "—";
  }

  async function userAction(userId: string, action: "pause" | "resume" | "delete", email?: string) {
    setNotice("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, confirmEmail: email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setNotice(say(lang, json.error || "Could not update that user."));
    await load();
  }

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      <form
        className="card"
        style={{ display: "grid", gap: 12, marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setNotice("");
          const res = await fetch("/api/admin/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ env: paypalEnv, clientId, clientSecret, cardEnabled }),
          });
          const json = await res.json();
          if (!res.ok) return setNotice(say(lang, json.error || "PayPal client ID is required."));
          setClientSecret("");
          if (json.env === "live" || json.env === "sandbox") setPaypalEnv(json.env);
          setSecretSet(Boolean(json.secretSet));
          setPaypalReady(Boolean(json.ready));
          setNotice(json.env && json.env !== paypalEnv ? t.paypalEnvFixed : t.saved);
        }}
      >
        <h2 style={{ margin: 0 }}>{t.paypalTitle}</h2>
        <p className="muted" style={{ margin: 0 }}>{t.paypalLede}</p>
        <p className="muted" style={{ margin: 0 }}>{paypalReady ? t.paypalOn : t.paypalOff}</p>
        <label>{t.paypalEnv}
          <select className="field" value={paypalEnv} onChange={(e) => setPaypalEnv(e.target.value === "live" ? "live" : "sandbox")}>
            <option value="sandbox">{t.sandbox}</option>
            <option value="live">{t.live}</option>
          </select>
        </label>
        <label>{t.clientId}
          <input className="field ltr" dir="ltr" value={clientId} onChange={(e) => setClientId(e.target.value)} autoComplete="off" />
        </label>
        <label>{t.secret}
          <input className="field ltr" dir="ltr" type="password" value={clientSecret} placeholder={secretSet ? t.secretKeep : ""} onChange={(e) => setClientSecret(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={cardEnabled} onChange={(e) => setCardEnabled(e.target.checked)} />
          {t.card}
        </label>
        <button className="btn">{t.paypalSave}</button>
        {notice && <p className="muted" style={{ margin: 0 }}>{notice}</p>}
      </form>
      <article className="card" style={{ overflowX: "auto" }}>
        <h2 style={{ marginTop: 0 }}>{t.users}</h2>
        {data.people.map((person) => (
          <section key={person.id} style={{ borderTop: "1px solid #1c3324", paddingTop: 12, marginTop: 12 }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong><bdi>{person.name}</bdi></strong>
              {" · "}
              <bdi className="ltr">{person.email}</bdi>
              {person.paused && <> · {t.paused}</>}
              {person.self && <> · {t.you}</>}
            </p>
            {!person.self && (
              <div className="row" style={{ marginBottom: 8 }}>
                <button className="btn ghost" type="button" onClick={() => userAction(person.id, person.paused ? "resume" : "pause")}>
                  {person.paused ? t.resume : t.pause}
                </button>
                <input
                  className="field ltr"
                  dir="ltr"
                  style={{ maxWidth: 260 }}
                  placeholder={t.deleteHint}
                  value={confirmEmail[person.id] ?? ""}
                  onChange={(e) => setConfirmEmail((current) => ({ ...current, [person.id]: e.target.value }))}
                />
                <button className="btn danger" type="button" onClick={() => userAction(person.id, "delete", confirmEmail[person.id] ?? "")}>
                  {t.deleteUser}
                </button>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>{t.workspace}</th>
                  <th>{t.role}</th>
                  <th>{t.subscription}</th>
                  <th>{t.valid}</th>
                  <th>{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {person.workspaces.map((row) => (
                  <tr key={row.id}>
                    <td><strong><bdi>{row.workspace}</bdi></strong></td>
                    <td>{t.roles[row.role] ?? row.role}</td>
                    <td>{row.access === "paid" ? t.paid49 : row.access === "trial" ? t.trial : t.expired}</td>
                    <td><bdi className="ltr">{when(row.access === "paid" ? row.paidUntil : row.trialEndsAt)}</bdi></td>
                    <td>
                      {row.payment ? (
                        <bdi className="ltr">{row.payment.amount} {row.payment.currency} · {t.statuses[row.payment.status] ?? row.payment.status}</bdi>
                      ) : t.noPayment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </article>
      <form
        className="card"
        style={{ display: "grid", gap: 12, marginTop: 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setNotice("");
          const res = await fetch("/api/admin/coupons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: couponCode,
              percentOff: Number(percentOff),
              maxUses: maxUses.trim() ? Number(maxUses) : null,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) return setNotice(say(lang, json.error || "Check the coupon fields."));
          setCouponCode("");
          setNotice(t.saved);
          await load();
        }}
      >
        <h2 style={{ margin: 0 }}>{t.coupons}</h2>
        <p className="muted" style={{ margin: 0 }}>{t.couponLede}</p>
        <label>{t.couponCode}
          <input className="field ltr" dir="ltr" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} required />
        </label>
        <label>{t.couponPercent}
          <input className="field" type="number" min={1} max={100} value={percentOff} onChange={(e) => setPercentOff(e.target.value)} required />
        </label>
        <label>{t.couponMax}
          <input className="field" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </label>
        <label>{t.couponExpiry}
          <input className="field" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>
        <button className="btn">{t.couponCreate}</button>
        {(data.coupons ?? []).length === 0 && <p className="muted" style={{ margin: 0 }}>{t.couponNone}</p>}
        {(data.coupons ?? []).map((coupon) => (
          <div key={coupon.id} className="row" style={{ justifyContent: "space-between" }}>
            <span>
              <bdi className="ltr">{coupon.code}</bdi>
              {" · "}
              {coupon.percentOff}%
              {" · "}
              {t.couponUses} {coupon.usedCount}{coupon.maxUses == null ? "" : `/${coupon.maxUses}`}
              {coupon.expiresAt ? ` · ${when(coupon.expiresAt)}` : ""}
              {!coupon.active ? ` · ${t.paused}` : ""}
            </span>
            {coupon.active && (
              <button
                className="btn ghost"
                type="button"
                onClick={async () => {
                  setNotice("");
                  const res = await fetch("/api/admin/coupons", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stopId: coupon.id, code: "STOP", percentOff: 1 }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) return setNotice(say(lang, json.error || "Check the coupon fields."));
                  await load();
                }}
              >
                {t.couponStop}
              </button>
            )}
          </div>
        ))}
      </form>
      <form
        className="card row"
        style={{ marginTop: 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remaining: Number(remaining) }),
          });
          await load();
        }}
      >
        <label className="muted">{t.seats}</label>
        <input className="field" type="number" min={0} value={remaining} onChange={(e) => setRemaining(e.target.value)} />
        <button className="btn">{t.save}</button>
      </form>
      <article className="card" style={{ marginTop: 14, overflowX: "auto" }}>
        <h2 style={{ marginTop: 0 }}>{t.payments}</h2>
        <table>
          <thead><tr><th>{t.workspace}</th><th>{t.amount}</th><th>{t.status}</th><th>{t.when}</th></tr></thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id}>
                <td><bdi>{p.workspace.name}</bdi></td>
                <td><bdi className="ltr">{p.amount} {p.currency}</bdi></td>
                <td>{t.statuses[p.status] ?? p.status}</td>
                <td><bdi className="ltr">{new Date(p.createdAt).toLocaleString(localeOf(lang))}</bdi></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      <article className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>{t.support}</h2>
        {data.tickets.map((ticket) => (
          <p key={ticket.id}><strong>{ticket.priority ? t.priority : t.basic}</strong> · <bdi>{ticket.workspace.name}</bdi> · <bdi className="ltr">{ticket.email}</bdi><br />{ticket.message}</p>
        ))}
      </article>
    </>
  );
}
