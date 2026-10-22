import { prisma } from "@/lib/db";
import { grantLaunchAccess } from "@/lib/grant";
import { sendPurchaseMail } from "@/lib/mail";
import { capturePaypalOrder, fetchPaypalOrder, paidAmount, receiptMatches, type PaidReceipt } from "@/lib/paypal";

export class PayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function paidAtOf(paid: PaidReceipt) {
  const at = paid.paidAt ? new Date(paid.paidAt) : null;
  return at && !Number.isNaN(at.getTime()) ? at : null;
}

/** If PayPal already took the money for a pending order, open the three years from that payment time. */
export async function recoverPaidOrder(workspaceId: string) {
  const pending = await prisma.payment.findMany({
    where: { workspaceId, status: "PENDING", NOT: { paypalOrderId: { startsWith: "coupon-" } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  for (const row of pending) {
    try {
      const paid = paidAmount(await fetchPaypalOrder(row.paypalOrderId));
      if (!receiptMatches(paid, row)) continue;
      const paidUntil = await grantLaunchAccess({
        workspaceId: row.workspaceId,
        paypalOrderId: row.paypalOrderId,
        amount: row.amount,
        currency: row.currency,
        couponId: row.couponId,
        paidAt: paidAtOf(paid),
      });
      const until = paidUntil instanceof Date ? paidUntil : new Date(paidUntil);
      await sendPurchaseMail(workspaceId, until);
      return until;
    } catch {
      continue;
    }
  }
  return null;
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
  if (!receiptMatches(paid, existing)) throw new PayError("This payment does not match the launch price.", 400);

  try {
    const paidUntil = await grantLaunchAccess({
      workspaceId: existing.workspaceId,
      paypalOrderId: orderId,
      amount: existing.amount,
      currency: existing.currency,
      couponId: existing.couponId,
      paidAt: paidAtOf(paid),
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
