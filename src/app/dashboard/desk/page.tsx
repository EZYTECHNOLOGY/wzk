"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, localeOf } from "@/lib/desk-copy";

type EventRow = {
  id: string;
  createdAt: string;
  status: string;
  note: string;
  utmSource: string;
  number: { label: string; phoneE164: string };
  link: { name: string; slug: string };
};

export default function DeskPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].desk;
  const [events, setEvents] = useState<EventRow[]>([]);
  const [filter, setFilter] = useState("OPEN");
  const [selected, setSelected] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/events");
    const json = await res.json();
    setEvents(json.events ?? []);
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const rows = events.filter((e) => filter === "ALL" || e.status === filter);
  const current = rows.find((e) => e.id === selected) ?? rows[0];
  const labels: Record<string, string> = { OPEN: t.open, FOLLOWED: t.followed, DONE: t.done, ALL: t.all };

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      <section className="kpis">
        <article className="kpi"><span>{t.open}</span><b>{events.filter((e) => e.status === "OPEN").length}</b></article>
        <article className="kpi"><span>{t.followed}</span><b>{events.filter((e) => e.status === "FOLLOWED").length}</b></article>
        <article className="kpi"><span>{t.done}</span><b>{events.filter((e) => e.status === "DONE").length}</b></article>
        <article className="kpi"><span>{t.all}</span><b>{events.length}</b></article>
      </section>
      <div className="row" style={{ marginTop: 16 }}>
        {["OPEN", "FOLLOWED", "DONE", "ALL"].map((key) => (
          <button key={key} className={`pill${filter === key ? " on" : ""}`} onClick={() => setFilter(key)}>{labels[key]}</button>
        ))}
      </div>
      <section className="grid-2">
        <ul className="card" style={{ listStyle: "none", padding: 8, margin: 0 }}>
          {rows.length === 0 && <li className="muted" style={{ padding: 12 }}>{t.empty}</li>}
          {rows.map((event) => (
            <li key={event.id}>
              <button onClick={() => setSelected(event.id)} style={{ width: "100%", textAlign: "start", background: current?.id === event.id ? "#102033" : "transparent", border: 0, borderRadius: 12, padding: 12, cursor: "pointer" }}>
                <strong><bdi>{event.number.label}</bdi></strong>
                <span className="muted"> · <bdi>{event.link.name}</bdi></span>
                <p className="muted" style={{ margin: "4px 0 0" }}>{new Date(event.createdAt).toLocaleString(localeOf(lang))} · {t.opened}{event.utmSource ? ` · ${event.utmSource}` : ""}</p>
              </button>
            </li>
          ))}
        </ul>
        <article className="card">
          {!current && <p className="muted">{t.choose}</p>}
          {current && (
            <>
              <h2 style={{ marginTop: 0 }}><bdi>{current.number.label}</bdi></h2>
              <p className="muted ltr">{current.number.phoneE164}</p>
              <a className="btn" href={`https://wa.me/${current.number.phoneE164.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{t.wa}</a>
              <form
                key={current.id}
                style={{ marginTop: 16, display: "grid", gap: 8 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  await fetch(`/api/events/${current.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note: data.get("note"), status: data.get("status") }),
                  });
                  await load();
                }}
              >
                <select name="status" defaultValue={current.status} className="field">
                  <option value="OPEN">{t.open}</option>
                  <option value="FOLLOWED">{t.followed}</option>
                  <option value="DONE">{t.done}</option>
                </select>
                <textarea name="note" defaultValue={current.note} placeholder={t.note} className="field" rows={4} />
                <button className="btn">{t.save}</button>
              </form>
            </>
          )}
        </article>
      </section>
    </>
  );
}
