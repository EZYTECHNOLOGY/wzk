"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/home-copy";

type LangValue = { lang: Lang; setLang: (next: Lang) => void };

const LangContext = createContext<LangValue>({ lang: "he", setLang: () => {} });

export function applyLang(next: Lang) {
  document.cookie = `wzk_lang=${next}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "he" ? "rtl" : "ltr";
}

export function LangProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  function setLang(next: Lang) {
    applyLang(next);
    setLangState(next);
    router.refresh();
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function CookieLangSwitch({ lang }: { lang: Lang }) {
  const router = useRouter();
  return (
    <LangSwitch
      lang={lang}
      onChange={(next) => {
        applyLang(next);
        router.refresh();
      }}
    />
  );
}

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (next: Lang) => void }) {
  const next: Lang = lang === "he" ? "en" : "he";
  return (
    <button type="button" className="lang-switch" onClick={() => onChange(next)}>
      {lang === "he" ? "English" : "עברית"}
    </button>
  );
}
