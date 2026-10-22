import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSessionToken, sessionCookie } from "@/lib/session";
import { TRIAL_DAYS } from "@/lib/plans";
import { adminEmail } from "@/lib/admin";
import { sendSignupMail } from "@/lib/mail";

const bodySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(100),
  passwordConfirm: z.string().min(8).max(100),
  workspace: z.string().min(1).max(80),
  lang: z.enum(["he", "en"]).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form and use at least 8 characters." }, { status: 400 });
  if (parsed.data.password !== parsed.data.passwordConfirm) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "That email already has an account." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: hashPassword(parsed.data.password),
      isAdmin: Boolean(adminEmail() && email === adminEmail()),
      memberships: {
        create: {
          role: "OWNER",
          workspace: { create: { name: parsed.data.workspace, trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000) } },
        },
      },
    },
    include: { memberships: true },
  });
  await sendSignupMail({ to: email, name: user.name, lang: parsed.data.lang === "en" ? "en" : "he" });
  const token = createSessionToken({ userId: user.id, workspaceId: user.memberships[0].workspaceId, email });
  const cookie = sessionCookie(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
