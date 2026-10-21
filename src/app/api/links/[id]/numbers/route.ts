import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf, limits } from "@/lib/plans";
import { normalizeE164 } from "@/lib/klik";

const schema = z.object({
  label: z.string().min(1).max(40),
  phone: z.string().min(7).max(20),
  weight: z.number().int().min(1).max(100).default(1),
  dailyCap: z.number().int().min(0).max(10000).default(0),
  hourStart: z.number().int().min(0).max(23).nullable().default(null),
  hourEnd: z.number().int().min(0).max(23).nullable().default(null),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;
  const link = await prisma.klikLink.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: { workspace: true, _count: { select: { numbers: true } } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = accessOf(link.workspace);
  if (access === "expired") return NextResponse.json({ error: "The trial week has ended." }, { status: 402 });
  const used = await prisma.klikNumber.count({ where: { link: { workspaceId: link.workspaceId } } });
  if (used >= limits(access).numbers) {
    return NextResponse.json({ error: "WhatsApp seat limit reached for this plan." }, { status: 409 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the number fields." }, { status: 400 });
  const phoneE164 = normalizeE164(parsed.data.phone);
  if (!phoneE164) return NextResponse.json({ error: "Use an international number, like +972501234567." }, { status: 400 });
  const number = await prisma.klikNumber.create({
    data: {
      linkId: link.id,
      label: parsed.data.label,
      phoneE164,
      weight: parsed.data.weight,
      dailyCap: parsed.data.dailyCap,
      hourStart: parsed.data.hourStart,
      hourEnd: parsed.data.hourEnd,
    },
  });
  return NextResponse.json({ number });
}
