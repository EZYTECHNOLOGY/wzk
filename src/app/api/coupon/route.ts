import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { findLiveCoupon, normalizeCode, quoteCoupon } from "@/lib/coupons";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = z
    .object({ code: z.string().min(1).max(24), currency: z.enum(["ILS", "USD"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That coupon is not valid." }, { status: 400 });
  const coupon = await findLiveCoupon(parsed.data.code);
  if (!coupon) return NextResponse.json({ error: "That coupon is not valid." }, { status: 404 });
  const price = quoteCoupon(parsed.data.currency, coupon.percentOff);
  return NextResponse.json({
    code: normalizeCode(parsed.data.code),
    percentOff: coupon.percentOff,
    amount: price.value,
    currency: price.currency,
    free: price.free,
  });
}
