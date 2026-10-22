import { prisma } from "@/lib/db";
import { grantLaunchAccess } from "@/lib/grant";
import { sendPurchaseMail } from "@/lib/mail";
import { capturePaypalOrder, paidAmount } from "@/lib/paypal";

export class PayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Apply a captured PayPal order to the workspace stored on that order. A missing session still grants the 3 years. */
export async function settlePaypalOrder(orderId: string, sessionWorkspaceId: string | null) {
  const existing = await prisma.payment.findUnique({ where: { paypalOrderId: orderId } });
  if (existing?.status === "CAPTURED" && existing.paidUntil) {
    return { paidUntil: existing.paidUntil, already: true };
  }
  if (!existing) throw new PayError("This payment does not match the launch price.", 400);
  if (sessionWorkspaceId && existing.workspaceId !== sessionWorkspaceId) {
    throw new PayError("This payment does not match the launch price.", 400);
  }

  let capture;
  try {
    capture = await capturePaypalOrder(orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal failed";
    throw new PayError(message, 502);
  }
  const paid = paidAmount(capture);
  const amountOk =
    paid.status === "COMPLETED" &&
    paid.currency === existing.currency &&
    Number(paid.value) === Number(existing.amount) &&
    paid.workspaceId === existing.workspaceId;
  if (!amountOk) throw new PayError("This payment does not match the launch price.", 400);

  try {
    const paidUntil = await grantLaunchAccess({
      workspaceId: existing.workspaceId,
      paypalOrderId: orderId,
      amount: existing.amount,
      currency: existing.currency,
      couponId: existing.couponId,
    });
    const until = paidUntil instanceof Date ? paidUntil : new Date(paidUntil);
    await sendPurchaseMail(existing.workspaceId, until);
    return { paidUntil: until, already: false };
  } catch (error) {
    if (error instanceof Error && error.message === "stock") {
      throw new PayError("Payment captured but launch stock was already gone. Write to support and we will refund.", 409);
    }
    if (error instanceof Error && error.message === "coupon") {
      throw new PayError("That coupon is not valid.", 409);
    }
    throw error;
  }
}
