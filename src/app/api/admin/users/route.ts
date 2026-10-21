import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";

async function guard() {
  const session = await getSession();
  if (!session) return null;
  if (!(await isAdminUser(session.userId, session.email))) return null;
  return session;
}

const bodySchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["pause", "resume", "delete"]),
  confirmEmail: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Could not update that user." }, { status: 400 });
  const { userId, action, confirmEmail } = parsed.data;
  if (userId === session.userId) return NextResponse.json({ error: "You cannot change your own account here." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { workspace: { include: { members: { select: { id: true } } } } } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "pause") {
    await prisma.user.update({ where: { id: user.id }, data: { pausedAt: user.pausedAt ?? new Date() } });
    return NextResponse.json({ ok: true, paused: true });
  }
  if (action === "resume") {
    await prisma.user.update({ where: { id: user.id }, data: { pausedAt: null } });
    return NextResponse.json({ ok: true, paused: false });
  }

  if (confirmEmail?.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Type that person's email to delete them." }, { status: 400 });
  }
  const solo = user.memberships.filter((seat) => seat.workspace.members.length === 1).map((seat) => seat.workspaceId);
  await prisma.$transaction(async (tx) => {
    if (solo.length) await tx.workspace.deleteMany({ where: { id: { in: solo } } });
    await tx.invite.deleteMany({ where: { email: user.email } });
    await tx.user.delete({ where: { id: user.id } });
  });
  return NextResponse.json({ ok: true, deleted: true });
}
