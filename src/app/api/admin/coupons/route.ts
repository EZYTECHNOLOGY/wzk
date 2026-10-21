import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { codeShape, normalizeCode } from "@/lib/coupons";

async function guard() {
  const session = await getSession();
  if (!session) return null;
  if (!(await isAdminUser(session.userId, session.email))) return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = z
    .object({
      code: z.string(),
      percentOff: z.number().int().min(1).max(100),
      maxUses: z.number().int().min(1).max(100000).nullable().optional(),
      expiresAt: z.string().nullable().optional(),
      stopId: z.string().uuid().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the coupon fields." }, { status: 400 });

  if (parsed.data.stopId) {
    await prisma.coupon.update({ where: { id: parsed.data.stopId }, data: { active: false } });
    return NextResponse.json({ ok: true });
  }

  const code = normalizeCode(parsed.data.code);
  if (!codeShape(code)) return NextResponse.json({ error: "Use 4 to 24 letters or numbers." }, { status: 400 });
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return NextResponse.json({ error: "Check the coupon fields." }, { status: 400 });
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentOff: parsed.data.percentOff,
        maxUses: parsed.data.maxUses ?? null,
        expiresAt,
      },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "That coupon code is already in use." }, { status: 409 });
  }
}
