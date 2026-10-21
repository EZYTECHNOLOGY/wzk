import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, getSession, sessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = z.object({ workspaceId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  const seat = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId: parsed.data.workspaceId } },
  });
  if (!seat) return NextResponse.json({ error: "Missing workspace" }, { status: 404 });
  const token = createSessionToken({ userId: session.userId, workspaceId: seat.workspaceId, email: session.email });
  const cookie = sessionCookie(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
