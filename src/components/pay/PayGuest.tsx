"use client";

import Link from "next/link";
import { useState } from "react";
import PayPalCheckout from "@/components/PayPalCheckout";
import type { Lang } from "@/lib/home-copy";

export default function PayGuest({ initialLang, failed }: { initialLang: Lang; failed?: boolean }) {
  const [lang] = useState<Lang>(initialLang);
  const [email, setEmail] = useState("");
  const [readyEmail, setReadyEmail] = useState("");
  const [done, setDone] = useState("");
  const he = lang === "he";
  const currency = he ? "ILS" : "USD";

  return (
    <div className="storefront min-h-dvh bg-paper px-4 py-10 text-ink">
      <div className="mx-auto grid max-w-lg gap-6">
        <Link href="/" className="font-display text-sm font-black">WZK</Link>
        <section className="wzk-block bg-klik p-6 md:p-8">
          <h1 className="wzk-display text-4xl">{he ? "שלוש שנים. בלי מנוי." : "Three years. No subscription."}</h1>
          <p className="mt-3 text-base font-bold">
            {he
              ? "רושמים את האימייל של החשבון. גם בלי להיות מחוברים, התשלום פותח את הדסק לשלוש שנים."
              : "Use the email on the account. Even signed out, the payment opens the desk for three years."}
          </p>
          <p className="mt-2 text-base font-bold">{he ? "49 ש״ח פעם אחת." : "18 USD once."}</p>
          {failed && <p className="mt-3 font-bold" style={{ color: "#9a1230" }}>{he ? "התשלום לא נקלט. נסו שוב." : "The payment was not applied. Try again."}</p>}
          {done ? (
            <p className="mt-6 text-base font-bold">
              {he ? `הדסק פתוח עד ${new Date(done).toLocaleDateString("he-IL")}. ` : `The desk is open until ${new Date(done).toLocaleDateString("en-US")}. `}
              <Link href="/login?paid=1" className="underline">{he ? "לכניסה" : "Log in"}</Link>
            </p>
          ) : (
            <form
              className="mt-6 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setReadyEmail(email.trim().toLowerCase());
              }}
            >
              <label className="grid gap-2 text-sm font-bold">
                {he ? "אימייל החשבון" : "Account email"}
                <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <button className="btn" type="submit">{he ? "להמשיך לתשלום" : "Continue to payment"}</button>
            </form>
          )}
          {readyEmail && !done && (
            <div className="mt-4">
              <PayPalCheckout key={readyEmail} currency={currency} email={readyEmail} onPaid={setDone} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
