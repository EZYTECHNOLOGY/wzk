import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

const schema = z.object({
  stage: z.enum(["NEW", "CONTACTED", "WON", "LOST"]).optional(),
  note: z.string().max(500).optional(),
  valueUsd: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  const lead = await prisma.klikLead.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const updated = await prisma.klikLead.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ lead: updated });
}
