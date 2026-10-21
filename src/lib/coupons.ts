import { prisma } from "@/lib/db";
import { priceAfterDiscount } from "@/lib/plans";

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function codeShape(code: string) {
  return /^[A-Z0-9-]{4,24}$/.test(code);
}

export async function findLiveCoupon(raw: string, now = new Date()) {
  const code = normalizeCode(raw);
  if (!codeShape(code)) return null;
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return null;
  if (coupon.expiresAt && coupon.expiresAt <= now) return null;
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return null;
  return coupon;
}

export function quoteCoupon(currency: "ILS" | "USD", percentOff: number) {
  return priceAfterDiscount(currency, percentOff);
}
