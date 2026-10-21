"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { deskCopy, say } from "@/lib/desk-copy";

export default function AccountPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = deskCopy[lang].account;
  const [error, setError] = useState("");

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <h1 className="page">{t.title}</h1>
      <p className="lede">{t.lede}</p>
      <article className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>{t.downloadTitle}</h2>
        <p className="muted">{t.downloadBody}</p>
        <a className="btn" href="/api/account/export">{t.download}</a>
      </article>
      <article className="card" style={{ marginTop: 14, borderColor: "rgba(255,107,122,0.35)" }}>
        <h2 style={{ marginTop: 0 }}>{t.closeTitle}</h2>
        <p className="muted">{t.closeBody}</p>
        <form
          style={{ display: "grid", gap: 8, maxWidth: 480 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const res = await fetch("/api/account/close", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: data.get("password"), phrase: data.get("phrase") }),
            });
            const json = await res.json();
            if (!res.ok) return setError(say(lang, json.error || "Could not close"));
            router.push("/");
          }}
        >
          <input name="password" type="password" required placeholder={t.password} className="field" />
          <input name="phrase" required placeholder={t.phrase} className="field" />
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <button className="btn danger" style={{ width: "fit-content" }}>{t.delete}</button>
        </form>
      </article>
    </>
  );
}
