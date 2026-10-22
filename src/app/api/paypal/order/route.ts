import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf, priceFor } from "@/lib/plans";
import { findLiveCoupon, normalizeCode, quoteCoupon } from "@/lib/coupons";
import { grantLaunchAccess } from "@/lib/grant";
import { createPaypalOrder, paypalConfigured } from "@/lib/paypal";
import { recoverPaidOrder } from "@/lib/paypal-settle";
import { sendPurchaseMail } from "@/lib/mail";

export async function POST(req: Request) {
  const session = await getSession();
  const parsed = z
    .object({
      currency: z.enum(["ILS", "USD"]),
      code: z.string().max(24).optional(),
      email: z.string().email().max(160).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose ILS or USD." }, { status: 400 });

  let workspaceId = session?.workspaceId ?? "";
  if (!workspaceId) {
    const email = parsed.data.email?.toLowerCase();
    if (!email) return NextResponse.json({ error: "Sign in" }, { status: 401 });
    const person = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { where: { role: "OWNER" }, include: { workspace: true }, orderBy: { workspace: { createdAt: "asc" } } } },
    });
    const openSeat = person?.memberships.find((seat) => accessOf(seat.workspace) !== "paid");
    if (!person || !openSeat) {
      return NextResponse.json({ error: person ? "This workspace already has the 3-year plan." : "No account for that email. Sign up first." }, { status: person ? 409 : 404 });
    }
    workspaceId = openSeat.workspaceId;
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Missing workspace" }, { status: 404 });
  if (accessOf(workspace) === "paid") return NextResponse.json({ error: "This workspace already has the 3-year plan." }, { status: 409 });
  const healed = await recoverPaidOrder(workspace.id);
  if (healed) return NextResponse.json({ granted: true, paidUntil: healed });
  const stock = await prisma.launchStock.findUnique({ where: { id: "launch" } });
  if (!stock || stock.remaining <= 0) return NextResponse.json({ error: "Launch stock is gone." }, { status: 409 });

  const rawCode = parsed.data.code?.trim() ?? "";
  const coupon = rawCode ? await findLiveCoupon(rawCode) : null;
  if (rawCode && !coupon) return NextResponse.json({ error: "That coupon is not valid." }, { status: 400 });
  const price = coupon ? quoteCoupon(parsed.data.currency, coupon.percentOff) : priceFor(parsed.data.currency);

  if (price.value === "0.00") {
    try {
      const paidUntil = await grantLaunchAccess({
        workspaceId: workspace.id,
        paypalOrderId: `coupon-${randomUUID()}`,
        amount: "0.00",
        currency: price.currency,
        couponId: coupon?.id,
      });
      const until = paidUntil instanceof Date ? paidUntil : new Date(paidUntil);
      await sendPurchaseMail(workspace.id, until);
      return NextResponse.json({ granted: true, paidUntil });
    } catch (error) {
      if (error instanceof Error && error.message === "stock") {
        return NextResponse.json({ error: "Launch stock is gone." }, { status: 409 });
      }
      if (error instanceof Error && error.message === "coupon") {
        return NextResponse.json({ error: "That coupon is not valid." }, { status: 409 });
      }
      throw error;
    }
  }

  if (!(await paypalConfigured())) return NextResponse.json({ error: "PayPal keys are not set yet." }, { status: 503 });
  try {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    const order = await createPaypalOrder({
      currency: parsed.data.currency,
      workspaceId: workspace.id,
      returnUrl: `${origin}/paypal/return`,
      cancelUrl: `${origin}/paypal/return?paypal=cancel`,
      amount: price.value,
    });
    await prisma.payment.create({
      data: {
        workspaceId: workspace.id,
        paypalOrderId: order.id,
        amount: price.value,
        currency: price.currency,
        status: "PENDING",
        couponId: coupon?.id ?? null,
      },
    });
    return NextResponse.json({ ...order, amount: price.value, code: coupon ? normalizeCode(rawCode) : "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
