import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in with the invited email first." }, { status: 401 });
  const { token } = await ctx.params;
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired." }, { status: 404 });
  if (invite.email !== session.email) return NextResponse.json({ error: `Sign in as ${invite.email} to accept.` }, { status: 403 });
  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: session.userId, workspaceId: invite.workspaceId } },
    update: { role: invite.role },
    create: { userId: session.userId, workspaceId: invite.workspaceId, role: invite.role },
  });
  await prisma.invite.delete({ where: { id: invite.id } });
  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
}
