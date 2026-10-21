"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy } from "@/lib/desk-copy";

type Lead = {
  id: string;
  name: string;
  phone: string;
  stage: string;
  valueUsd: number;
  note: string;
  source: string;
  followUpAt: string | null;
};

export default function FollowupsPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].follow;
  const [leads, setLeads] = useState<Lead[]>([]);

  async function load() {
    const res = await fetch("/api/leads");
    const json = await res.json();
    setLeads(json.leads ?? []);
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  const due = leads.filter((l) => l.followUpAt && new Date(l.followUpAt) <= new Date() && l.stage !== "WON" && l.stage !== "LOST").length;
  const wonValue = leads.filter((l) => l.stage === "WON").reduce((s, l) => s + l.valueUsd, 0);

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="page">{t.title}</h1>
        </div>
      </div>
      <p className="lede">{t.lede}</p>
      <section className="kpis">
        <article className="kpi"><span>{t.due}</span><b>{due}</b></article>
        <article className="kpi"><span>{t.open}</span><b>{leads.filter((l) => l.stage === "NEW" || l.stage === "CONTACTED").length}</b></article>
        <article className="kpi"><span>{t.won}</span><b>{leads.filter((l) => l.stage === "WON").length}</b></article>
        <article className="kpi"><span>{t.estimated}</span><b>${wonValue}</b></article>
      </section>
      <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>{t.name}</th><th>{t.source}</th><th>{t.stage}</th><th>{t.value}</th><th></th></tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td><bdi>{lead.name}</bdi><div className="muted ltr">{lead.phone}</div></td>
                <td>{lead.source || "—"}</td>
                <td>{t.stages[lead.stage as keyof typeof t.stages] ?? lead.stage}</td>
                <td>${lead.valueUsd}</td>
                <td>
                  <select
                    className="field"
                    value={lead.stage}
                    onChange={async (e) => {
                      await fetch(`/api/leads/${lead.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ stage: e.target.value }),
                      });
                      await load();
                    }}
                  >
                    <option value="NEW">{t.stages.NEW}</option>
                    <option value="CONTACTED">{t.stages.CONTACTED}</option>
                    <option value="WON">{t.stages.WON}</option>
                    <option value="LOST">{t.stages.LOST}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <p className="muted">{t.empty}</p>}
      </div>
      <form
        className="card form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              phone: data.get("phone"),
              source: data.get("source"),
              valueUsd: Number(data.get("value") || 0),
              note: data.get("note") || "",
              followUpAt: data.get("when") || undefined,
            }),
          });
          form.reset();
          await load();
        }}
      >
        <input name="name" required placeholder={t.name} className="field" />
        <input name="phone" placeholder={t.phone} className="field" />
        <input name="source" placeholder={t.sourcePh} className="field" />
        <input name="value" type="number" min={0} placeholder={t.valuePh} className="field" />
        <input name="when" type="date" className="field" />
        <input name="note" placeholder={t.note} className="field" />
        <button className="btn">{t.add}</button>
      </form>
    </>
  );
}
