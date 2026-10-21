import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

const schema = z.object({
  isActive: z.boolean().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  dailyCap: z.number().int().min(0).max(10000).optional(),
  hourStart: z.number().int().min(0).max(23).nullable().optional(),
  hourEnd: z.number().int().min(0).max(23).nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  const number = await prisma.klikNumber.findFirst({ where: { id, link: { workspaceId: session.workspaceId } } });
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const updated = await prisma.klikNumber.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ number: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  const number = await prisma.klikNumber.findFirst({ where: { id, link: { workspaceId: session.workspaceId } } });
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.klikNumber.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
