import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { accessOf, trialEnd } from "@/lib/plans";

async function guard() {
  const session = await getSession();
  if (!session) return null;
  if (!(await isAdminUser(session.userId, session.email))) return null;
  return session;
}

export async function GET() {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const [stock, payments, tickets, users, coupons] = await Promise.all([
    prisma.launchStock.upsert({ where: { id: "launch" }, update: {}, create: { id: "launch", remaining: 300 } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { workspace: { select: { name: true } } },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { workspace: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        pausedAt: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                plan: true,
                trialEndsAt: true,
                paidUntil: true,
                createdAt: true,
                payments: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const people = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    paused: Boolean(user.pausedAt),
    self: user.id === session.userId,
    workspaces: user.memberships.map((seat) => {
      const workspace = seat.workspace;
      const payment = workspace.payments[0] ?? null;
      return {
        id: workspace.id,
        role: seat.role,
        workspace: workspace.name,
        access: accessOf(workspace),
        trialEndsAt: trialEnd(workspace),
        paidUntil: workspace.paidUntil,
        payment: payment
          ? { amount: payment.amount, currency: payment.currency, status: payment.status, createdAt: payment.createdAt }
          : null,
      };
    }),
  }));
  return NextResponse.json({ stock, payments, tickets, people, coupons });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = z.object({ remaining: z.number().int().min(0).max(100000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Remaining must be a number." }, { status: 400 });
  const stock = await prisma.launchStock.upsert({
    where: { id: "launch" },
    update: { remaining: parsed.data.remaining },
    create: { id: "launch", remaining: parsed.data.remaining },
  });
  return NextResponse.json({ stock });
}
