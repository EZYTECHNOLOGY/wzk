import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const [members, invites, workspace] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId: session.workspaceId },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.invite.findMany({ where: { workspaceId: session.workspaceId, expiresAt: { gt: new Date() } } }),
    prisma.workspace.findUnique({ where: { id: session.workspaceId } }),
  ]);
  return NextResponse.json({ members, invites, workspace });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const parsed = z.object({ email: z.string().email(), role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const invite = await prisma.invite.create({
    data: {
      workspaceId: session.workspaceId,
      email,
      role: parsed.data.role,
      token: randomBytes(18).toString("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  return NextResponse.json({ invite, url: `${origin}/invite/${invite.token}` });
}
