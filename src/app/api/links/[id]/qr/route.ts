import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { closedWorkspaceResponse } from "@/lib/open";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const closed = await closedWorkspaceResponse(session.workspaceId);
  if (closed) return closed;
  const { id } = await ctx.params;
  const link = await prisma.klikLink.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const svg = await QRCode.toString(`${origin}/r/${link.slug}`, { type: "svg", margin: 1, color: { dark: "#0b0b13", light: "#ffffff" } });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
