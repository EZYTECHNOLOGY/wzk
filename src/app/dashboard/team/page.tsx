"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, say } from "@/lib/desk-copy";

type Member = { id: string; role: string; user: { name: string; email: string } };

export default function TeamPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].team;
  const [members, setMembers] = useState<Member[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/team");
    const json = await res.json();
    setMembers(json.members ?? []);
    setWorkspace(json.workspace?.name ?? "");
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      <section className="grid-2">
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{workspace || t.workspace}</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {members.map((m) => (
              <li key={m.id} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span><bdi>{m.user.name}</bdi><span className="muted"> · <bdi className="ltr">{m.user.email}</bdi></span></span>
                <span className="pill">{t.roles[m.role] ?? m.role}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{t.invite}</h2>
          <form
            style={{ display: "grid", gap: 8 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.get("email"), role: data.get("role") }),
              });
              const json = await res.json();
              if (!res.ok) return setError(say(lang, json.error || "Could not invite"));
              setLink(json.url);
              setError("");
            }}
          >
            <input name="email" type="email" required placeholder={t.email} className="field" />
            <select name="role" className="field"><option value="MEMBER">{t.member}</option><option value="ADMIN">{t.admin}</option></select>
            <button className="btn">{t.create}</button>
          </form>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          {link && <p className="muted">{t.share}<br />{link}</p>}
        </article>
      </section>
    </>
  );
}
