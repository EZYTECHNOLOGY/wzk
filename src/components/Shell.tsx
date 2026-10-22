"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LangSwitch, useLang } from "@/components/LangProvider";
import { deskCopy } from "@/lib/desk-copy";

export default function Shell({
  email,
  name,
  plan,
  isAdmin,
  locked,
  workspaceId,
  workspaces,
  children,
}: {
  email: string;
  name: string;
  plan: string;
  isAdmin?: boolean;
  locked?: boolean;
  workspaceId: string;
  workspaces: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = deskCopy[lang].shell;
  const initial = (name || email).slice(0, 1).toUpperCase();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const menuLabel = open ? (lang === "he" ? "סגירת תפריט" : "Close menu") : (lang === "he" ? "תפריט" : "Menu");

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => {
      setCompact(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-lock", open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nav-lock");
    };
  }, [open]);
  const workspace = locked
    ? []
    : [
        { href: "/dashboard", label: t.overview },
        { href: "/dashboard/routing", label: t.routing },
        { href: "/dashboard/desk", label: t.desk },
        { href: "/dashboard/followups", label: t.followups },
        { href: "/dashboard/reports", label: t.reports },
      ];
  const manage = locked
    ? [
        { href: "/dashboard/plan", label: t.plan },
        { href: "/dashboard/account", label: t.account },
      ]
    : [
        { href: "/dashboard/team", label: t.team },
        { href: "/dashboard/account", label: t.account },
        { href: "/dashboard/plan", label: t.plan },
        { href: "/dashboard/help", label: t.help },
      ];

  function item(href: string, label: string) {
    const active = href === "/dashboard" ? path === href : path === href || path.startsWith(`${href}/`);
    return (
      <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`} onClick={() => setOpen(false)}>
        <span>{label}</span>
        {active && <span aria-hidden>{lang === "he" ? "‹" : "›"}</span>}
      </Link>
    );
  }

  return (
    <div className={`shell${open ? " nav-open" : ""}`}>
      <div className="nav-backdrop" onClick={() => setOpen(false)} />
      <aside id="app-nav" className="side" inert={compact && !open ? true : undefined}>
        <Link href={locked ? "/dashboard/plan" : "/dashboard"} className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">WZK</span>
          <strong>Who Ze Klik</strong>
        </Link>
        {workspace.length > 0 && (
          <div>
            <p className="nav-label">{t.workspace}</p>
            {workspace.map((l) => item(l.href, l.label))}
          </div>
        )}
        <div>
          <p className="nav-label">{t.manage}</p>
          {manage.map((l) => item(l.href, l.label))}
          {isAdmin && item("/dashboard/admin", t.admin)}
        </div>
        <div className="side-foot">
          <Link href="/" className="nav-link" onClick={() => setOpen(false)}>{t.website}</Link>
          <button
            className="nav-link"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
            }}
          >
            {t.signOut}
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="app-nav"
            aria-label={menuLabel}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="menu-glyph" />
          </button>
          <div className="topbar-end">
          <LangSwitch lang={lang} onChange={setLang} />
          <div className="who">
            {workspaces.length > 1 ? (
              <select
                className="field"
                aria-label={t.here}
                value={workspaceId}
                onChange={async (e) => {
                  await fetch("/api/workspace", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workspaceId: e.target.value }),
                  });
                  router.push("/dashboard");
                  router.refresh();
                }}
              >
                {workspaces.map((seat) => (
                  <option key={seat.id} value={seat.id}>{seat.name}</option>
                ))}
              </select>
            ) : (
              <bdi>{name}</bdi>
            )}
            <span className="plan-chip">{plan === "KLIK" ? t.planPaid : t.planFree}</span>
            <span className="avatar" title={email}>{initial}</span>
          </div>
          </div>
        </div>
        {locked && <p className="lede">{t.locked}</p>}
        {children}
      </div>
    </div>
  );
}
