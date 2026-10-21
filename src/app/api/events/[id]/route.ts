import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  const parsed = z
    .object({ note: z.string().max(500).optional(), status: z.enum(["OPEN", "FOLLOWED", "DONE"]).optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const event = await prisma.klikEvent.findFirst({ where: { id, link: { workspaceId: session.workspaceId } } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.klikEvent.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ event: updated });
}
