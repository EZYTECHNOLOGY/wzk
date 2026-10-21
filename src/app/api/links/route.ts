import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf, limits } from "@/lib/plans";
import { closedWorkspaceResponse } from "@/lib/open";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  strategy: z.enum(["ROUND_ROBIN", "WEIGHTED"]).default("ROUND_ROBIN"),
  kind: z.enum(["ROTATOR", "BRAND", "AD"]).default("ROTATOR"),
  prefill: z.string().max(500).default(""),
  stickyDays: z.number().int().min(0).max(30).default(0),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const [workspace, links] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session.workspaceId } }),
    prisma.klikLink.findMany({
      where: { workspaceId: session.workspaceId },
      include: { numbers: { orderBy: { label: "asc" } }, _count: { select: { events: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return NextResponse.json({ workspace, links });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name and a short address (a-z, 0-9, -) are required." }, { status: 400 });
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Workspace missing" }, { status: 404 });
  const access = accessOf(workspace);
  if (access === "expired") return NextResponse.json({ error: "The trial week has ended. Pay once to open the Agency plan for 3 years." }, { status: 402 });
  const count = await prisma.klikLink.count({ where: { workspaceId: workspace.id } });
  if (count >= limits(access).links) {
    return NextResponse.json({ error: "Link limit reached for this plan." }, { status: 409 });
  }
  try {
    const link = await prisma.klikLink.create({
      data: { ...parsed.data, workspaceId: workspace.id },
      include: { numbers: true, _count: { select: { events: true } } },
    });
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ error: "That address is already taken." }, { status: 409 });
  }
}
