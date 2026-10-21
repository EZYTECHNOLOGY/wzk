import type { Plan } from "@prisma/client";

export const TRIAL_DAYS = 7;
export const PAID_YEARS = 3;
export const PRICE_ILS = "49.00";
export const PRICE_USD = "18.00";
export const LAUNCH_STOCK_DEFAULT = 300;

export type Access = "trial" | "paid" | "expired";

type WorkspaceAccess = {
  plan: Plan;
  trialEndsAt: Date | null;
  paidUntil: Date | null;
  createdAt: Date;
};

export function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function trialEnd(workspace: WorkspaceAccess): Date {
  return workspace.trialEndsAt ?? new Date(workspace.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function accessOf(workspace: WorkspaceAccess, now = new Date()): Access {
  if (workspace.plan === "KLIK" && workspace.paidUntil && workspace.paidUntil > now) return "paid";
  if (trialEnd(workspace) > now) return "trial";
  return "expired";
}

/** Trial: 3 links, 5 WhatsApp seats, 7 days. Paid Agency: 20 links, 10 WhatsApp numbers, 3 years. */
export function limits(access: Access) {
  if (access === "paid") return { links: 20, numbers: 10, reportDays: null as number | null };
  if (access === "trial") return { links: 3, numbers: 5, reportDays: 30 };
  return { links: 0, numbers: 0, reportDays: 30 };
}

export function priceFor(currency: "ILS" | "USD") {
  return currency === "ILS" ? { currency, value: PRICE_ILS } : { currency, value: PRICE_USD };
}

/** Percent off the launch price. 100 returns 0.00, which checkout grants without PayPal. */
export function priceAfterDiscount(currency: "ILS" | "USD", percentOff: number) {
  const base = currency === "ILS" ? 4900 : 1800;
  const percent = Math.min(100, Math.max(0, Math.round(percentOff)));
  const cents = Math.round((base * (100 - percent)) / 100);
  return { currency, value: (cents / 100).toFixed(2), free: cents === 0 };
}
