import { prisma } from "@/lib/db";
import { addYears, PAID_YEARS } from "@/lib/plans";

export async function grantLaunchAccess(input: {
  workspaceId: string;
  paypalOrderId: string;
  amount: string;
  currency: string;
  couponId?: string | null;
}) {
  const paidUntil = addYears(new Date(), PAID_YEARS);
  await prisma.$transaction(async (tx) => {
    const again = await tx.payment.findUnique({ where: { paypalOrderId: input.paypalOrderId } });
    if (again?.status === "CAPTURED") return;

    const seat = await tx.launchStock.updateMany({
      where: { id: "launch", remaining: { gt: 0 } },
      data: { remaining: { decrement: 1 } },
    });
    if (seat.count !== 1) {
      if (again) await tx.payment.update({ where: { id: again.id }, data: { status: "OVERSOLD" } });
      else {
        await tx.payment.create({
          data: {
            workspaceId: input.workspaceId,
            paypalOrderId: input.paypalOrderId,
            amount: input.amount,
            currency: input.currency,
            status: "OVERSOLD",
            couponId: input.couponId ?? null,
          },
        });
      }
      throw new Error("stock");
    }

    if (input.couponId) {
      const taken = await tx.$executeRaw`
        UPDATE "Coupon"
        SET "usedCount" = "usedCount" + 1
        WHERE "id" = ${input.couponId}
          AND "active" = true
          AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
          AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
      `;
      if (taken !== 1) {
        await tx.launchStock.update({ where: { id: "launch" }, data: { remaining: { increment: 1 } } });
        if (again) await tx.payment.update({ where: { id: again.id }, data: { status: "COUPON_USED" } });
        throw new Error("coupon");
      }
    }

    if (again) {
      await tx.payment.update({
        where: { id: again.id },
        data: { status: "CAPTURED", paidUntil, amount: input.amount, currency: input.currency },
      });
    } else {
      await tx.payment.create({
        data: {
          workspaceId: input.workspaceId,
          paypalOrderId: input.paypalOrderId,
          amount: input.amount,
          currency: input.currency,
          status: "CAPTURED",
          paidUntil,
          couponId: input.couponId ?? null,
        },
      });
    }
    await tx.workspace.update({
      where: { id: input.workspaceId },
      data: { plan: "KLIK", paidUntil },
    });
  });
  const saved = await prisma.payment.findUnique({ where: { paypalOrderId: input.paypalOrderId } });
  return saved?.paidUntil ?? paidUntil;
}
