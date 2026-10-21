import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { priceFor } from "@/lib/plans";
import { grantLaunchAccess } from "@/lib/grant";
import { capturePaypalOrder, paidAmount } from "@/lib/paypal";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = z.object({ orderId: z.string().min(4) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing PayPal order." }, { status: 400 });

  const existing = await prisma.payment.findUnique({ where: { paypalOrderId: parsed.data.orderId } });
  if (existing?.status === "CAPTURED") {
    return NextResponse.json({ ok: true, paidUntil: existing.paidUntil });
  }
  if (existing && existing.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "This payment does not match the launch price." }, { status: 400 });
  }

  let capture;
  try {
    capture = await capturePaypalOrder(parsed.data.orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const paid = paidAmount(capture);
  const listed = paid.currency === "ILS" || paid.currency === "USD" ? priceFor(paid.currency) : null;
  const expectedValue = existing?.status === "PENDING" ? existing.amount : listed?.value;
  const expectedCurrency = existing?.status === "PENDING" ? existing.currency : listed?.currency;
  const amountOk =
    expectedValue &&
    expectedCurrency &&
    paid.currency === expectedCurrency &&
    Number(paid.value) === Number(expectedValue) &&
    paid.status === "COMPLETED";
  if (!amountOk || paid.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "This payment does not match the launch price." }, { status: 400 });
  }

  try {
    const paidUntil = await grantLaunchAccess({
      workspaceId: session.workspaceId,
      paypalOrderId: parsed.data.orderId,
      amount: expectedValue,
      currency: expectedCurrency,
      couponId: existing?.couponId,
    });
    return NextResponse.json({ ok: true, paidUntil });
  } catch (error) {
    if (error instanceof Error && error.message === "stock") {
      return NextResponse.json({ error: "Payment captured but launch stock was already gone. Write to support and we will refund." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "coupon") {
      return NextResponse.json({ error: "That coupon is not valid." }, { status: 409 });
    }
    throw error;
  }
}
