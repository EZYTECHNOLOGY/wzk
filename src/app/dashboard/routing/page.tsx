"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, say } from "@/lib/desk-copy";

type NumberRow = {
  id: string;
  label: string;
  phoneE164: string;
  weight: number;
  isActive: boolean;
  dailyCap: number;
  hourStart: number | null;
  hourEnd: number | null;
  startsCount: number;
};
type LinkRow = {
  id: string;
  slug: string;
  name: string;
  strategy: "ROUND_ROBIN" | "WEIGHTED";
  prefill: string;
  isActive: boolean;
  stickyDays: number;
  numbers: NumberRow[];
  _count: { events: number };
};

export default function RoutingPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].routing;
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [error, setError] = useState("");
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  const [address, setAddress] = useState("");
  const [origin, setOrigin] = useState("");

  async function load() {
    const res = await fetch("/api/links");
    const json = await res.json();
    setLinks(json.links ?? []);
  }
  useEffect(() => {
    setOrigin(window.location.origin);
    load().catch(() => setError(say(lang, "Could not load links.")));
  }, [lang]);

  function adUrl(slug: string) {
    const u = new URL(`/r/${slug}`, window.location.origin);
    if (utm.source) u.searchParams.set("utm_source", utm.source);
    if (utm.medium) u.searchParams.set("utm_medium", utm.medium);
    if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
    return u.toString();
  }

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <form
        className="card"
        style={{ marginTop: 18, display: "grid", gap: 10 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              slug: String(data.get("slug") || "").toLowerCase(),
              strategy: data.get("strategy"),
              kind: data.get("kind"),
              prefill: data.get("prefill") || "",
              stickyDays: Number(data.get("stickyDays") || 0),
            }),
          });
          const json = await res.json();
          if (!res.ok) return setError(say(lang, json.error || "Could not create the link"));
          form.reset();
          setAddress("");
          setError("");
          await load();
        }}
      >
        <div className="row">
          <input name="name" required placeholder={t.linkName} className="field" dir="auto" />
          <input
            name="slug"
            required
            placeholder={t.slug}
            className="field"
            value={address}
            onChange={(e) => setAddress(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
          <select name="strategy" className="field">
            <option value="ROUND_ROBIN">{t.round}</option>
            <option value="WEIGHTED">{t.weighted}</option>
          </select>
          <select name="kind" className="field">
            <option value="ROTATOR">{t.rotator}</option>
            <option value="BRAND">{t.brand}</option>
            <option value="AD">{t.ad}</option>
          </select>
          <input name="stickyDays" type="number" min={0} max={30} placeholder={t.sticky} className="field" />
        </div>
        <input name="prefill" placeholder={t.prefill} className="field" />
        <div>
          <p className="muted" style={{ margin: "0 0 4px" }}>{t.preview}</p>
          <p className="link-demo">{origin}/r/{address || t.sample}</p>
        </div>
        <button className="btn" style={{ width: "fit-content" }}>{t.create}</button>
      </form>
      <div className="card" style={{ marginTop: 12 }}>
        <p className="eyebrow">{t.builder}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <input className="field" placeholder={t.source} value={utm.source} onChange={(e) => setUtm({ ...utm, source: e.target.value })} />
          <input className="field" placeholder={t.medium} value={utm.medium} onChange={(e) => setUtm({ ...utm, medium: e.target.value })} />
          <input className="field" placeholder={t.campaign} value={utm.campaign} onChange={(e) => setUtm({ ...utm, campaign: e.target.value })} />
        </div>
      </div>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12, marginTop: 14 }}>
        {links.map((link) => (
          <li key={link.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong><bdi>{link.name}</bdi></strong>
                <p className="muted"><bdi className="ltr">/r/{link.slug}</bdi> · {link.strategy === "WEIGHTED" ? t.weighted : t.round} · {link._count.events} {t.kliks}{!link.isActive ? ` · ${t.paused}` : ""}</p>
              </div>
              <div className="row">
                <button className="btn ghost" onClick={() => navigator.clipboard.writeText(adUrl(link.slug))}>{t.copy}</button>
                <a className="btn ghost" href={`/api/links/${link.id}/qr`}>QR</a>
                <button className="btn ghost" onClick={() => navigator.clipboard.writeText(`<a href="${window.location.origin}/b/${link.slug}">WhatsApp</a>`)}>{t.button}</button>
                <button
                  className="btn ghost"
                  onClick={async () => {
                    await fetch(`/api/links/${link.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !link.isActive }) });
                    await load();
                  }}
                >
                  {link.isActive ? t.pause : t.resume}
                </button>
                <button
                  className="btn danger"
                  onClick={async () => {
                    if (!window.confirm(t.removeAsk)) return;
                    const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) return setError(say(lang, json.error || "Could not delete the link"));
                    setError("");
                    await load();
                  }}
                >
                  {t.remove}
                </button>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {link.numbers.map((n) => (
                <li key={n.id} className="num-row">
                  <bdi>{n.label}</bdi>
                  <bdi className="ltr">{n.phoneE164}</bdi>
                  <span className="muted">
                    {n.startsCount} {t.kliks}
                    {n.dailyCap > 0 ? ` · ${t.cap} ${n.dailyCap}/${t.day}` : ""}
                    {n.hourStart != null ? <> · <bdi className="ltr">{n.hourStart}:00–{n.hourEnd}:00</bdi></> : null}
                    {!n.isActive ? ` · ${t.paused}` : ""}
                  </span>
                  <button
                    className="pill"
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/numbers/${n.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !n.isActive }) });
                      await load();
                    }}
                  >
                    {n.isActive ? t.pause : t.resume}
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(t.removeNumberAsk)) return;
                      const res = await fetch(`/api/numbers/${n.id}`, { method: "DELETE" });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) return setError(say(lang, json.error || "Could not delete the link"));
                      setError("");
                      await load();
                    }}
                  >
                    {t.remove}
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="row"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const start = String(data.get("hourStart") || "");
                const end = String(data.get("hourEnd") || "");
                const res = await fetch(`/api/links/${link.id}/numbers`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    label: data.get("label"),
                    phone: data.get("phone"),
                    weight: Number(data.get("weight") || 1),
                    dailyCap: Number(data.get("dailyCap") || 0),
                    hourStart: start === "" ? null : Number(start),
                    hourEnd: end === "" ? null : Number(end),
                  }),
                });
                const json = await res.json();
                if (!res.ok) return setError(say(lang, json.error || "Could not add the number"));
                form.reset();
                setError("");
                await load();
              }}
            >
              <input name="label" required placeholder={t.name} className="field" dir="auto" />
              <input name="phone" required placeholder={t.phone} className="field" dir="ltr" />
              <input name="weight" type="number" min={1} placeholder={t.weight} className="field" />
              <input name="dailyCap" type="number" min={0} placeholder={t.daily} className="field" />
              <input name="hourStart" type="number" min={0} max={23} placeholder={t.from} className="field" />
              <input name="hourEnd" type="number" min={0} max={23} placeholder={t.until} className="field" />
              <button className="btn">{t.add}</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
