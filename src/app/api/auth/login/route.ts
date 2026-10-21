import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, sessionCookie } from "@/lib/session";
import { adminEmail } from "@/lib/admin";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { memberships: { orderBy: { workspace: { createdAt: "asc" } }, take: 1 } },
  });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash) || !user.memberships[0]) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }
  if (user.pausedAt) return NextResponse.json({ error: "This account is paused." }, { status: 403 });
  const token = createSessionToken({
    userId: user.id,
    workspaceId: user.memberships[0].workspaceId,
    email: user.email,
  });
  const cookie = sessionCookie(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
