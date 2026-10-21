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
  const leads = await prisma.klikLead.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ leads });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(24).default(""),
  source: z.string().max(80).default(""),
  valueUsd: z.number().int().min(0).max(10000000).default(0),
  note: z.string().max(500).default(""),
  followUpAt: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const lead = await prisma.klikLead.create({
    data: {
      workspaceId: session.workspaceId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      source: parsed.data.source,
      valueUsd: parsed.data.valueUsd,
      note: parsed.data.note,
      followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null,
    },
  });
  return NextResponse.json({ lead });
}
