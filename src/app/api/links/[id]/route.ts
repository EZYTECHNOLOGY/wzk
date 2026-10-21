import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  strategy: z.enum(["ROUND_ROBIN", "WEIGHTED"]).optional(),
  prefill: z.string().max(500).optional(),
  stickyDays: z.number().int().min(0).max(30).optional(),
  isActive: z.boolean().optional(),
});

async function owned(id: string, workspaceId: string) {
  return prisma.klikLink.findFirst({ where: { id, workspaceId } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  if (!(await owned(id, session.workspaceId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const link = await prisma.klikLink.update({ where: { id }, data: parsed.data, include: { numbers: true } });
  return NextResponse.json({ link });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  if (!(await owned(id, session.workspaceId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.klikLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
