import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = z.object({ password: z.string().min(1), phrase: z.string() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.phrase !== "DELETE MY WZK ACCOUNT") {
    return NextResponse.json({ error: "Type DELETE MY WZK ACCOUNT to confirm." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  await prisma.workspace.delete({ where: { id: session.workspaceId } });
  const left = await prisma.membership.count({ where: { userId: user.id } });
  if (left === 0) await prisma.user.delete({ where: { id: user.id } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
