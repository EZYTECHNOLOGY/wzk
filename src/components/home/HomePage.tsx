"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { dict, LANG_KEY, type Lang } from "@/lib/storefront-copy";

function HeroPush({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="hero-push group relative inline-flex items-center justify-center rounded-brand border-[3px] border-ink bg-ink px-8 py-4 font-display text-lg font-black text-paper shadow-[6px_6px_0_0_#15934a] transition-[transform,box-shadow] duration-150 hover:-translate-y-[2px] hover:shadow-[8px_8px_0_0_#15934a] active:translate-y-[3px] active:shadow-[2px_2px_0_0_#15934a] motion-reduce:transition-none rtl:shadow-[-6px_6px_0_0_#15934a] rtl:hover:shadow-[-8px_8px_0_0_#15934a] rtl:active:shadow-[-2px_2px_0_0_#15934a]"
    >
      {children}
      <span aria-hidden className="ms-2 inline-block transition-transform duration-150 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">➜</span>
    </Link>
  );
}

function NavPush({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-brand border-[3px] border-ink bg-klik px-4 py-2 font-display text-sm font-black text-ink shadow-[4px_4px_0_0_#ff7ac6] transition-[transform,box-shadow] duration-150 hover:bg-sun active:translate-y-[2px] active:shadow-[1px_1px_0_0_#ff7ac6] motion-reduce:transition-none rtl:shadow-[-4px_4px_0_0_#ff7ac6] rtl:active:shadow-[-1px_1px_0_0_#ff7ac6]"
    >
      {children}
    </Link>
  );
}

function PlanPush({ href, inverted, children }: { href: string; inverted?: boolean; children: ReactNode }) {
  const base = "flex w-full items-center justify-center rounded-brand border-[3px] border-ink px-6 py-5 text-center font-display text-3xl font-black leading-none md:text-4xl transition-[transform,box-shadow] duration-150 active:translate-y-[3px] motion-reduce:transition-none";
  const skin = inverted
    ? "plan-invert bg-ink text-paper shadow-[5px_5px_0_0_#ffd23f] hover:shadow-[7px_7px_0_0_#ffd23f] active:shadow-[1px_1px_0_0_#ffd23f] rtl:shadow-[-5px_5px_0_0_#ffd23f] rtl:hover:shadow-[-7px_7px_0_0_#ffd23f] rtl:active:shadow-[-1px_1px_0_0_#ffd23f]"
    : "bg-card text-ink shadow-[5px_5px_0_0_#ff7ac6] hover:shadow-[7px_7px_0_0_#ff7ac6] active:shadow-[1px_1px_0_0_#ff7ac6] rtl:shadow-[-5px_5px_0_0_#ff7ac6] rtl:hover:shadow-[-7px_7px_0_0_#ff7ac6] rtl:active:shadow-[-1px_1px_0_0_#ff7ac6]";
  return <Link href={href} className={`${base} ${skin}`}>{children}</Link>;
}

function Sticker({ tone = "sticker", children, className = "" }: { tone?: "sticker" | "sun" | "sky" | "klik"; children: ReactNode; className?: string }) {
  const tones = { sticker: "bg-sticker", sun: "bg-sun", sky: "bg-sky", klik: "bg-klik" } as const;
  return (
    <span className={`inline-block rounded-full border-[3px] border-ink px-3 py-1 font-display text-xs font-black uppercase tracking-wide text-ink shadow-[3px_3px_0_0_#141414] ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

function Glyph({ index, size = 64 }: { index: number; size?: number }) {
  return (
    <img src={`/assets/icons/icon-${index}.png`} alt="" width={size} height={size} className="block select-none" draggable={false} />
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t-[3px] border-ink">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="group flex w-full items-center justify-between gap-6 py-5 text-start">
        <span className="font-display text-xl font-black leading-tight md:text-2xl">{q}</span>
        <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-sticker font-display text-lg font-black transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-45" : "group-hover:rotate-12"}`}>+</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-[250ms] ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="max-w-[65ch] pb-6 text-base font-bold leading-relaxed text-ink-soft md:text-lg">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ initialLang, signedIn = false }: { initialLang: Lang; signedIn?: boolean }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [menu, setMenu] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const t = dict[lang];
  const startHref = signedIn ? "/dashboard" : "/signup";
  const startLabel = signedIn ? (lang === "he" ? "לפתוח את הדסק" : "Open the desk") : t.nav.cta;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if ((saved === "he" || saved === "en") && saved !== initialLang) {
        document.cookie = `wzk_lang=${saved}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === "he" ? "rtl" : "ltr";
        setLang(saved);
      }
    } catch {
      /* storage blocked: keep the cookie language */
    }
  }, [initialLang]);

  useEffect(() => {
    fetch("/api/launch").then((r) => r.json()).then((j) => setLeft(j.remaining ?? null)).catch(() => {});
  }, []);

  function switchLang() {
    const next: Lang = lang === "he" ? "en" : "he";
    document.cookie = `wzk_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    try { window.localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
    setLang(next);
    setMenu(false);
  }

  return (
    <div className="storefront min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-grid h-10 w-14 place-items-center rounded-brand border-[3px] border-ink bg-klik font-display text-base font-black text-ink shadow-[3px_3px_0_0_#ff7ac6]">WZK</span>
            <span className="hidden font-display text-sm font-black sm:inline">Who Ze Klik</span>
          </Link>
          <nav className="hidden items-center gap-6 font-bold md:flex">
            <a href="#steps" className="hover:underline hover:decoration-[3px] hover:underline-offset-4">{t.nav.steps}</a>
            <a href="#channels" className="hover:underline hover:decoration-[3px] hover:underline-offset-4">{t.nav.channels}</a>
            <a href="#pricing" className="hover:underline hover:decoration-[3px] hover:underline-offset-4">{t.nav.pricing}</a>
            <a href="#faq" className="hover:underline hover:decoration-[3px] hover:underline-offset-4">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-brand border-[3px] border-ink bg-card font-display text-lg font-black md:hidden"
              aria-expanded={menu}
              aria-label={lang === "he" ? "תפריט" : "Menu"}
              onClick={() => setMenu((value) => !value)}
            >
              {menu ? "×" : "☰"}
            </button>
            <button
              type="button"
              onClick={switchLang}
              aria-label={lang === "he" ? "Switch to English" : "החלפה לעברית"}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border-[3px] border-ink bg-card px-3 font-display text-sm font-black text-ink transition-colors hover:bg-sky active:translate-y-[1px]"
            >
              {lang === "he" ? "EN" : "עב"}
            </button>
            <NavPush href={startHref}>{startLabel}</NavPush>
          </div>
        </div>
        <div className={`nav-sheet px-4 py-3 md:hidden ${menu ? "open" : ""}`}>
          {[
            ["#steps", t.nav.steps],
            ["#channels", t.nav.channels],
            ["#pricing", t.nav.pricing],
            ["#faq", t.nav.faq],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenu(false)} className="border-b-2 border-ink/15 py-3 font-display text-lg font-black">
              {label}
            </a>
          ))}
          {!signedIn && <Link href="/login" onClick={() => setMenu(false)} className="py-3 font-bold">{lang === "he" ? "כניסה" : "Log in"}</Link>}
        </div>
      </header>

      <main id="top">
        <section className="px-4 pt-6 sm:px-6 md:pt-10">
          <div className="wzk-block mx-auto max-w-7xl overflow-hidden bg-klik">
            <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:gap-6 md:p-12">
              <div className="order-2 md:order-1">
                <h1 className="wzk-display text-5xl sm:text-6xl md:text-7xl">
                  <span className="wzk-rise block">{t.hero.line1}</span>
                  <span className="wzk-rise-2 block">{t.hero.line2}</span>
                  <span className="wzk-rise-3 block">
                    <span className="inline-block -rotate-1 rounded-md bg-ink px-2 text-paper">{t.hero.line3}</span>
                  </span>
                </h1>
                <p className="mt-6 max-w-[48ch] text-lg leading-relaxed font-bold md:text-xl">{t.hero.sub}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <HeroPush href={startHref}>{signedIn ? startLabel : t.hero.cta}</HeroPush>
                  <span className="text-sm font-bold text-ink/80">{t.hero.secondary}</span>
                </div>
              </div>
              <div className="relative order-1 md:order-2">
                <Sticker tone="sticker" className="absolute -top-2 start-2 z-10 -rotate-6">3 taps</Sticker>
                <div className="wzk-block-sm overflow-hidden bg-paper">
                  <img src="/assets/hero.jpg" alt={t.hero.alt} width={1024} height={1024} className="block aspect-square w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="steps" className="wzk-halftone px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="wzk-display max-w-[20ch] text-4xl md:text-6xl">{t.steps.title}</h2>
              <Sticker tone="sticker" className="-rotate-3">{lang === "he" ? "לחצו" : "Press"}</Sticker>
            </div>
            <p className="mt-3 text-lg font-bold text-ink-soft">{t.steps.sub}</p>
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.steps.items.map((step, index) => {
                const tones = ["bg-card", "bg-sun", "bg-sky", "bg-klik"];
                return (
                  <li key={step.n} className={`wzk-block-sm relative p-6 pt-10 ${tones[index]}`}>
                    <span className="absolute -top-4 start-4 grid size-10 place-items-center rounded-full border-[3px] border-ink bg-ink font-display text-lg font-black text-paper">{step.n}</span>
                    <h3 className="font-display text-2xl font-black leading-tight">{step.title}</h3>
                    <p className="mt-2 text-base font-bold leading-relaxed text-ink-soft">{step.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="channels" className="px-4 pb-16 sm:px-6 md:pb-24">
          <div className="wzk-block mx-auto max-w-7xl bg-sun p-6 md:p-12">
            <h2 className="wzk-display max-w-[16ch] text-4xl md:text-6xl">{t.channels.title}</h2>
            <p className="mt-3 max-w-[50ch] text-lg font-bold">{t.channels.sub}</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3 md:grid-rows-2">
              {t.channels.items.map((channel, index) => (
                <article key={channel.title} className={`wzk-block-sm flex flex-col justify-between bg-card p-6 ${index === 0 ? "md:row-span-2 md:p-8" : ""}`}>
                  <Glyph index={channel.icon} size={index === 0 ? 96 : 64} />
                  <div className="mt-6">
                    <h3 className="font-display text-2xl font-black md:text-3xl">{channel.title}</h3>
                    <p className="mt-2 max-w-[40ch] text-base font-bold leading-relaxed text-ink-soft">{channel.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 md:pb-24">
          <div className="wzk-block mx-auto grid max-w-7xl items-center gap-8 bg-sky p-6 md:grid-cols-[1.1fr_1fr] md:p-12">
            <div>
              <h2 className="wzk-display max-w-[14ch] text-4xl md:text-6xl">{t.desk.title}</h2>
              <p className="mt-4 max-w-[50ch] text-lg font-bold leading-relaxed">{t.desk.sub}</p>
              <ul className="mt-6 space-y-3">
                {t.desk.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-base font-bold">
                    <span aria-hidden className="mt-1 inline-block size-4 shrink-0 rotate-12 rounded-sm border-[3px] border-ink bg-klik" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="wzk-block-sm mt-8 max-w-sm bg-card p-4">
                <div className="flex items-center justify-between border-b-[3px] border-ink pb-2">
                  <span className="font-display text-base font-black">{t.desk.title2}</span>
                  <Sticker tone="klik" className="rotate-2">{t.desk.new}</Sticker>
                </div>
                <ul className="divide-y-2 divide-ink/15">
                  {t.desk.rows.map((row) => (
                    <li key={row.name} className="flex items-center justify-between py-2 text-sm font-bold">
                      <span>{row.name}</span>
                      <span className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-xs uppercase">{row.src}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="wzk-block-sm overflow-hidden bg-card">
              <img src="/assets/desk.jpg" alt={t.desk.alt} width={1024} height={768} className="block w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="wzk-halftone px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="wzk-display max-w-[16ch] text-4xl md:text-6xl">{t.rules.title}</h2>
            <p className="mt-3 max-w-[50ch] text-lg font-bold text-ink-soft">{t.rules.sub}</p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {t.rules.items.map((rule, index) => (
                <article key={rule.title} className={`wzk-block-sm flex items-start gap-5 bg-card p-6 ${index % 2 ? "sm:translate-y-4" : ""}`}>
                  <div className="shrink-0 rounded-brand border-[3px] border-ink bg-paper p-2">
                    <Glyph index={rule.icon} size={56} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black leading-tight">{rule.title}</h3>
                    <p className="mt-2 text-base font-bold leading-relaxed text-ink-soft">{rule.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 pb-16 sm:px-6 md:pb-24">
          <div className="wzk-block mx-auto max-w-7xl bg-klik p-6 md:p-12">
            <h2 className="wzk-display max-w-[16ch] text-4xl md:text-6xl">{t.pricing.title}</h2>
            <p className="mt-3 max-w-[50ch] text-lg font-bold">
              {t.pricing.sub}
              {left != null ? (lang === "he" ? ` נשארו ${left} מקומות.` : ` ${left} seats left.`) : ""}
            </p>
            <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-6">
              {t.pricing.plans.map((plan, index) => (
                <article key={plan.name} className={`wzk-block relative flex flex-col p-6 md:p-8 ${index === 1 ? "bg-card" : "bg-paper"}`}>
                  <Sticker tone={index === 1 ? "sticker" : "sky"} className="absolute -top-4 end-4 rotate-3">{plan.badge}</Sticker>
                  <h3 className="font-display text-2xl font-black">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="wzk-display text-7xl">{plan.price}</span>
                    <span className="text-base font-bold text-ink-soft">{plan.note}</span>
                  </div>
                  <ul className="mt-6 grow space-y-2 border-t-[3px] border-ink pt-5">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-base font-bold">
                        <span aria-hidden className="font-display font-black text-klik-deep">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <PlanPush href={signedIn ? "/dashboard/plan" : index === 1 ? "/pay" : "/signup"} inverted={index === 1}>{signedIn && index === 1 ? (lang === "he" ? "לתשלום" : "Pay") : plan.cta}</PlanPush>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 pb-20 sm:px-6 md:pb-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="wzk-display text-4xl md:text-6xl">{t.faq.title}</h2>
            <div className="mt-10 border-b-[3px] border-ink">
              {t.faq.items.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-[3px] border-ink bg-ink px-4 py-12 text-paper sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="inline-grid h-10 w-14 place-items-center rounded-brand border-[3px] border-paper bg-klik font-display text-base font-black text-ink shadow-[3px_3px_0_0_#ff7ac6]">WZK</span>
            <p className="font-display text-lg font-black">{t.footer.line}</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold text-paper/80">
            <a href="#pricing" className="hover:text-sun">{t.nav.pricing}</a>
            <a href="#faq" className="hover:text-sun">{t.nav.faq}</a>
            <Link href="/login" className="hover:text-sun">{lang === "he" ? "כניסה" : "Log in"}</Link>
            <span>{t.footer.made}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
