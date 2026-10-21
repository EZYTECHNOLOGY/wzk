import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf, limits, trialEnd } from "@/lib/plans";
import { paypalConfigured } from "@/lib/paypal";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Missing workspace" }, { status: 404 });
  const stock = await prisma.launchStock.upsert({
    where: { id: "launch" },
    update: {},
    create: { id: "launch", remaining: 300 },
  });
  const access = accessOf(workspace);
  return NextResponse.json({
    access,
    limits: limits(access),
    trialEndsAt: trialEnd(workspace),
    paidUntil: workspace.paidUntil,
    remaining: stock.remaining,
    paypal: await paypalConfigured(),
  });
}
