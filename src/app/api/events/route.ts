import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const linkId = new URL(req.url).searchParams.get("linkId") ?? undefined;
  const events = await prisma.klikEvent.findMany({
    where: { link: { workspaceId: session.workspaceId }, ...(linkId ? { linkId } : {}) },
    include: { number: { select: { label: true, phoneE164: true } }, link: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ events });
}
