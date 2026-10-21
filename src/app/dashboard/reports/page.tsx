"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy } from "@/lib/desk-copy";

type Report = {
  kliks: number;
  leads: number;
  won: number;
  wonValue: number;
  byDay: Record<string, number>;
  bySource: Record<string, number>;
  byNumber: Record<string, number>;
  byDevice?: Record<string, number>;
  byCountry?: Record<string, number>;
};

export default function ReportsPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].reports;
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then(setReport).catch(() => {});
  }, []);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return [d, report?.byDay?.[d] ?? 0] as const;
  });
  const max = Math.max(1, ...days.map(([, n]) => n));
  const sources = Object.entries(report?.bySource ?? {}).sort((a, b) => b[1] - a[1]);
  const numbers = Object.entries(report?.byNumber ?? {}).sort((a, b) => b[1] - a[1]);
  const devices = Object.entries(report?.byDevice ?? {});
  const countries = Object.entries(report?.byCountry ?? {});
  const top = Math.max(1, ...numbers.map(([, n]) => n));
  const deviceName = (name: string) => t.devices[name] ?? name;

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      <section className="kpis">
        <article className="kpi"><span>{t.kliks}</span><b>{report?.kliks ?? "—"}</b></article>
        <article className="kpi"><span>{t.added}</span><b>{report?.leads ?? "—"}</b></article>
        <article className="kpi"><span>{t.won}</span><b>{report?.won ?? "—"}</b></article>
        <article className="kpi"><span>{t.estimated}</span><b>${report?.wonValue ?? 0}</b></article>
      </section>
      <section className="grid-2">
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{t.daily}</h2>
          <div className="bars" aria-hidden>
            {days.map(([day, n]) => <i key={day} className={n ? "" : "empty"} title={`${day}: ${n}`} style={{ height: `${Math.max(6, (n / max) * 100)}%` }} />)}
          </div>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{t.byNumber}</h2>
          {numbers.map(([label, n]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span>{label}</span><span>{n}</span></div>
              <div style={{ height: 8, borderRadius: 99, background: "#102033" }}>
                <div style={{ width: `${(n / top) * 100}%`, height: "100%", borderRadius: 99, background: "var(--green)" }} />
              </div>
            </div>
          ))}
        </article>
      </section>
      <article className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>{t.bySource}</h2>
        <table>
          <thead><tr><th>{t.source}</th><th>{t.kliks}</th></tr></thead>
          <tbody>
            {sources.map(([source, n]) => <tr key={source}><td>{source}</td><td>{n}</td></tr>)}
          </tbody>
        </table>
      </article>
      <div className="grid-2" style={{ marginTop: 12 }}>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>{t.device}</h3>
          {devices.map(([name, n]) => <p key={name}>{deviceName(name)} · {n}</p>)}
        </article>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>{t.country}</h3>
          {countries.map(([name, n]) => <p key={name}>{name} · {n}</p>)}
        </article>
      </div>
    </>
  );
}
