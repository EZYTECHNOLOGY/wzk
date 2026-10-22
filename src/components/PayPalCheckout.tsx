"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { deskCopy, say } from "@/lib/desk-copy";

type SdkButton = {
  isEligible: () => boolean;
  render: (el: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
};

type ClassicSdk = {
  FUNDING: { PAYPAL: string; CARD: string };
  Buttons: (opts: {
    fundingSource?: string;
    style?: { layout?: string; height?: number; shape?: string };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: () => void;
    onCancel?: () => void;
  }) => SdkButton;
};

declare global {
  interface Window {
    paypal?: ClassicSdk & { createInstance?: unknown };
    __wzkPaypalKey?: string;
  }
}

const sdkLoads = new Map<string, Promise<ClassicSdk>>();

function loadClassic(clientId: string, currency: "ILS" | "USD", card: boolean) {
  const key = `${clientId}:${currency}:${card ? "card" : "paypal"}:embed3`;
  const cached = sdkLoads.get(key);
  if (cached) return cached;
  if (window.paypal?.Buttons && window.__wzkPaypalKey === key) {
    const done = Promise.resolve(window.paypal);
    sdkLoads.set(key, done);
    return done;
  }
  if (window.paypal && window.__wzkPaypalKey !== key) {
    const reset = sessionStorage.getItem("wzk-pp-reset");
    if (reset !== key) {
      sessionStorage.setItem("wzk-pp-reset", key);
      window.location.reload();
      return new Promise<ClassicSdk>(() => {});
    }
  }
  const pending = new Promise<ClassicSdk>((resolve, reject) => {
    const funding = card ? "&enable-funding=card,credit" : "";
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons${funding}&disable-funding=paylater,venmo`;
    script.async = true;
    script.dataset.wzkPaypal = "buttons";
    script.setAttribute("data-popups-disabled", "true");
    script.onload = () => {
      if (!window.paypal?.Buttons) {
        reject(new Error("PayPal did not start"));
        return;
      }
      window.__wzkPaypalKey = key;
      sessionStorage.removeItem("wzk-pp-reset");
      resolve(window.paypal);
    };
    script.onerror = () => reject(new Error("PayPal did not start"));
    document.head.appendChild(script);
  });
  sdkLoads.set(key, pending);
  pending.catch(() => sdkLoads.delete(key));
  return pending;
}

export default function PayPalCheckout({
  currency,
  onPaid,
  code = "",
  email = "",
}: {
  currency: "ILS" | "USD";
  onPaid: (until: string) => void;
  code?: string;
  email?: string;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [, setCardEnabled] = useState(true);
  const { lang } = useLang();
  const t = deskCopy[lang].plan;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token || params.get("paypal") === "cancel") return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: token }),
      });
      const json = await res.json();
      if (cancelled) return;
      window.history.replaceState(null, "", "/dashboard/plan");
      if (!res.ok) {
        setError(say(lang, json.error || "Payment was not granted"));
        return;
      }
      onPaid(json.paidUntil);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, onPaid]);

  useEffect(() => {
    const holder = slot.current;
    if (!holder) return;
    let cancelled = false;

    async function mount() {
      const configRes = await fetch("/api/paypal/config");
      const config = (await configRes.json()) as {
        clientId?: string;
        cardEnabled?: boolean;
        ready?: boolean;
      };
      if (cancelled || !holder) return;
      if (!config.ready || !config.clientId) {
        setReady(false);
        return;
      }
      const card = config.cardEnabled !== false;
      setCardEnabled(card);
      const paypal = await loadClassic(config.clientId, currency, card);
      if (cancelled || !holder) return;
      holder.replaceChildren();
      const handlers = {
        style: { layout: "vertical", height: 45, shape: "rect" },
        createOrder: async () => {
          const res = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currency, code, email: email || undefined }),
          });
          const json = await res.json();
          if (res.ok && json.granted && json.paidUntil) {
            onPaid(json.paidUntil);
            throw new Error("granted");
          }
          if (!res.ok || !json.id) {
            const message = say(lang, json.error || "Could not start checkout");
            setError(message);
            throw new Error(message);
          }
          return json.id as string;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const json = await res.json();
          if (!res.ok) {
            setError(say(lang, json.error || "Payment was not granted"));
            return;
          }
          onPaid(json.paidUntil);
        },
        onCancel: () => {},
        onError: () => setError(say(lang, "Could not start checkout")),
      };
      const paypalSlot = document.createElement("div");
      holder.appendChild(paypalSlot);
      const paypalButton = paypal.Buttons({ fundingSource: paypal.FUNDING.PAYPAL, ...handlers });
      const paypalReady = paypalButton.render(paypalSlot);
      if (card) {
        const cardButton = paypal.Buttons({ fundingSource: paypal.FUNDING.CARD, ...handlers });
        if (cardButton.isEligible()) {
          const cardSlot = document.createElement("div");
          cardSlot.style.marginTop = "12px";
          holder.appendChild(cardSlot);
          cardButton.render(cardSlot).catch(() => cardSlot.remove());
        }
      }
      await Promise.race([paypalReady, new Promise((resolve) => window.setTimeout(resolve, 1500))]);
      if (!cancelled) setReady(true);
    }

    const timer = window.setTimeout(() => {
      if (!cancelled && !holder.querySelector("iframe")) setReady(false);
    }, 12000);
    mount().catch(() => {
      if (!cancelled) setReady(false);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [code, currency, email, lang, onPaid]);

  if (ready === false) return <p className="muted">{t.paypal}</p>;
  return (
    <div className="pay-slot" style={{ display: "grid", gap: 12 }}>
      <div ref={slot} className="paypal-inline" dir="ltr" />
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
