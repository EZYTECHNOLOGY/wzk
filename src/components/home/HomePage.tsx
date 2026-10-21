"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { homeCopy, type Lang } from "@/lib/home-copy";
import RouterStage from "./RouterStage";

const ICONS = [
  "M4 6h16v10H4zM8 20h8M12 16v4M7 12l3-3 2 2 4-4",
  "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  "M4 19V5M4 19h16M8 15l3-4 3 2 4-6",
];

export default function HomePage({ initialLang, signedIn = false }: { initialLang: Lang; signedIn?: boolean }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [left, setLeft] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const t = homeCopy[lang];
  useEffect(() => {
    fetch("/api/launch").then((r) => r.json()).then((j) => setLeft(j.remaining ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const close = () => { if (!mq.matches) setMenu(false); };
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-lock", menu);
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nav-lock");
    };
  }, [menu]);

  function switchLang() {
    const next: Lang = lang === "he" ? "en" : "he";
    document.cookie = `wzk_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
    setLang(next);
  }

  return (
    <div className="home">
      <div className="home-glow" aria-hidden />
      <header className={`home-bar${menu ? " menu-open" : ""}`}>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={menu}
          aria-controls="home-nav"
          aria-label={menu ? (lang === "he" ? "סגירת תפריט" : "Close menu") : (lang === "he" ? "תפריט" : "Menu")}
          onClick={() => setMenu((value) => !value)}
        >
          <span className="menu-glyph" />
        </button>
        <Link href="/" className="brand" onClick={() => setMenu(false)}>
          <span className="brand-mark">Wzk.io</span>
          <strong>Who Ze Klik</strong>
        </Link>
        <nav id="home-nav" className="home-nav">
          {t.nav.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>
          ))}
          <div className="home-nav-cta">
            {signedIn ? (
              <Link href="/dashboard" className="btn" onClick={() => setMenu(false)}>{t.desk}</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenu(false)}>{t.login}</Link>
                <Link href="/signup" className="btn" onClick={() => setMenu(false)}>{t.start}</Link>
              </>
            )}
          </div>
        </nav>
        {menu && <div className="nav-backdrop home-backdrop" onClick={() => setMenu(false)} />}
        <div className="home-actions">
          <button type="button" className="lang-switch" onClick={switchLang}>{t.langLabel}</button>
          {signedIn ? (
            <Link href="/dashboard" className="btn">{t.desk}</Link>
          ) : (
            <>
              <Link href="/login">{t.login}</Link>
              <Link href="/signup" className="btn">{t.start}</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h1>
              {t.heroTitle.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="hero-body">{t.heroBody}</p>
            <div className="row" style={{ marginTop: 28 }}>
              {signedIn ? (
                <Link href="/dashboard" className="btn home-cta">{t.desk}</Link>
              ) : (
                <>
                  <Link href="/signup" className="btn home-cta">{t.start}</Link>
                  <Link href="/login" className="btn ghost home-cta">{t.desk}</Link>
                </>
              )}
            </div>
            <p className="muted" style={{ marginTop: 14 }}>{t.heroNote}</p>
          </div>
          <div className="orb" aria-hidden>
            <span className="orb-ring" />
            <span className="orb-ring delay" />
            <span className="orb-core">Wzk.io</span>
          </div>
        </section>

        <section id="product" className="block">
          <h2>{t.campaignsTitle}</h2>
          <p className="lede center">{t.campaignsBody}</p>
          <div className="cards-3">
            {t.campaigns.map(([title, body], i) => (
              <article key={title} className="card">
                <span className="icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[i]} />
                  </svg>
                </span>
                <h3>{title}</h3>
                <p className="muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="turn" className="block suite">
          <div>
            <p className="eyebrow">{t.suiteEyebrow}</p>
            <h2 className="display">{t.suiteTitle}</h2>
            <p className="lede">{t.suiteBody}</p>
            <ol className="steps-list">
              {t.suiteSteps.map(([title, body], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p className="muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <RouterStage
            names={t.demoNames}
            link={t.demoLink}
            click={t.demoClick}
            fresh={t.demoNew}
            assigned={t.demoAssigned}
            desk={t.demoDesk}
            aria={t.demoAria}
          />
        </section>

        <section id="steps" className="block">
          <p className="eyebrow center">{t.stepsEyebrow}</p>
          <h2 className="center">{t.stepsTitle}</h2>
          <div className="cards-3">
            {t.steps.map(([n, title, body]) => (
              <article key={n} className="card">
                <span className="step-no">{n}</span>
                <h3>{title}</h3>
                <p className="muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block suite">
          <div>
            <p className="eyebrow">{t.flowEyebrow}</p>
            <h2 className="display">{t.flowTitle}</h2>
            <p className="lede">{t.flowBody}</p>
            <ul className="checks">
              {t.flowPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
          <article className="card desk-preview">
            <p className="eyebrow">{t.demoDesk}</p>
            <div className="desk-row on">
              <strong>{t.demoNames[1]}</strong>
              <span>{t.demoNew}</span>
            </div>
            <div className="desk-row">
              <strong>{t.demoNames[0]}</strong>
              <span className="muted">meta</span>
            </div>
            <div className="desk-row">
              <strong>{t.demoNames[2]}</strong>
              <span className="muted">qr</span>
            </div>
          </article>
        </section>

        <section className="block">
          <p className="eyebrow center">{t.workflowEyebrow}</p>
          <h2 className="center">{t.workflowTitle}</h2>
          <p className="lede center">{t.workflowBody}</p>
          <div className="cards-2">
            {t.workflows.map(([title, body], i) => (
              <article key={title} className="card flow">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p className="muted">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="block">
          <p className="eyebrow center">{t.faqEyebrow}</p>
          <h2 className="center">{t.faqTitle}</h2>
          <div className="faq">
            {t.faqs.map(([q, a]) => (
              <details key={q} className="card">
                <summary>{q}</summary>
                <p className="muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="price" className="block">
          <p className="eyebrow center neon-years">{t.priceEyebrow}</p>
          <h2 className="center">{t.priceTitle}</h2>
          <div className="cards-2 price">
            <article className="card">
              <p className="eyebrow">{t.freeName}</p>
              <h3>0</h3>
              <ul>{t.freeItems.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={signedIn ? "/dashboard" : "/signup"} className="btn ghost">{signedIn ? t.desk : t.start}</Link>
            </article>
            <article className="card price-on">
              <p className="eyebrow">{t.klikName}</p>
              <h3>{t.klikPrice}</h3>
              <p className="muted">{left == null ? "" : lang === "he" ? `${left} מקומות נשארו` : `${left} seats left`}</p>
              <ul>{t.klikItems.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={signedIn ? "/dashboard/plan" : "/signup"} className="btn">{lang === "he" ? "לתשלום בפייפאל או בכרטיס" : "Pay with PayPal or card"}</Link>
            </article>
          </div>
        </section>

        <section className="finale">
          <h2>{t.finalTitle}</h2>
          <p className="lede center">{t.finalBody}</p>
          <Link href={signedIn ? "/dashboard" : "/signup"} className="btn home-cta">{signedIn ? t.desk : t.start}</Link>
        </section>
      </main>
      <footer className="home-foot">{t.footer}</footer>
    </div>
  );
}
