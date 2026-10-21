import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { accessOf } from "@/lib/plans";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const parsed = z.object({ message: z.string().min(4).max(2000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a short message." }, { status: 400 });
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Missing workspace" }, { status: 404 });
  const ticket = await prisma.supportTicket.create({
    data: {
      workspaceId: workspace.id,
      email: session.email,
      message: parsed.data.message,
      priority: accessOf(workspace) === "paid",
    },
  });
  return NextResponse.json({ ticket });
}
