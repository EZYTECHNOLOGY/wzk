import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const [workspace, links, leads] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session.workspaceId }, select: { id: true, name: true, plan: true, timezone: true, createdAt: true } }),
    prisma.klikLink.findMany({
      where: { workspaceId: session.workspaceId },
      include: { numbers: true, events: true },
    }),
    prisma.klikLead.findMany({ where: { workspaceId: session.workspaceId } }),
  ]);
  return new NextResponse(JSON.stringify({ workspace, links, leads }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=who-ze-klik-export.json",
    },
  });
}
