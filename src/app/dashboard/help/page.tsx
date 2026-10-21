"use client";

import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, say } from "@/lib/desk-copy";

export default function HelpPage() {
  const { lang } = useLang();
  const t = deskCopy[lang].help;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <h1 className="page">{t.title}</h1>
      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        {t.faqs.map(([q, a]) => (
          <article key={q} className="card">
            <strong>{q}</strong>
            <p className="muted">{a}</p>
          </article>
        ))}
      </div>
      <form
        className="card"
        style={{ marginTop: 14, display: "grid", gap: 10 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const message = String(new FormData(e.currentTarget).get("message") || "");
          const res = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          });
          const json = await res.json();
          if (!res.ok) return setError(say(lang, json.error || "Could not send"));
          setSent(true);
          setError("");
        }}
      >
        <p className="eyebrow">{t.support}</p>
        <p className="muted">{t.supportBody}</p>
        <textarea name="message" required className="field" rows={4} placeholder={t.placeholder} />
        <button className="btn" style={{ width: "fit-content" }}>{t.send}</button>
        {sent && <p>{t.sent}</p>}
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      </form>
    </>
  );
}
