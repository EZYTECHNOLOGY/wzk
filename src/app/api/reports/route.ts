import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf, limits } from "@/lib/plans";
import { closedWorkspaceResponse } from "@/lib/open";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Missing workspace" }, { status: 404 });
  const access = accessOf(workspace);
  const cap = limits(access).reportDays;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const earliest = cap == null ? new Date(0) : new Date(Date.now() - cap * 24 * 60 * 60 * 1000);
  const since = from ? new Date(from) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const until = to ? new Date(to) : new Date();
  const start = since < earliest ? earliest : since;
  const events = await prisma.klikEvent.findMany({
    where: { link: { workspaceId: session.workspaceId }, createdAt: { gte: start, lte: until } },
    include: { number: { select: { label: true } }, link: { select: { name: true } } },
  });
  const byDay: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byNumber: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    const source = event.utmCampaign || event.utmSource || event.link.name || "Direct";
    bySource[source] = (bySource[source] ?? 0) + 1;
    byNumber[event.number.label] = (byNumber[event.number.label] ?? 0) + 1;
    byDevice[event.device || "unknown"] = (byDevice[event.device || "unknown"] ?? 0) + 1;
    byCountry[event.country || "unknown"] = (byCountry[event.country || "unknown"] ?? 0) + 1;
  }
  const leads = await prisma.klikLead.count({ where: { workspaceId: session.workspaceId, createdAt: { gte: start } } });
  const won = await prisma.klikLead.aggregate({
    where: { workspaceId: session.workspaceId, stage: "WON" },
    _sum: { valueUsd: true },
    _count: true,
  });
  return NextResponse.json({
    kliks: events.length,
    leads,
    won: won._count,
    wonValue: won._sum.valueUsd ?? 0,
    byDay,
    bySource,
    byNumber,
    byDevice,
    byCountry,
    access,
  });
}
