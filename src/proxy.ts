import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { accessOf } from "@/lib/plans";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const OPEN = ["/dashboard/plan", "/dashboard/account", "/dashboard/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (session) {
    const person = await prisma.user.findUnique({ where: { id: session.userId }, select: { pausedAt: true } });
    if (!person || person.pausedAt) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      const res = NextResponse.redirect(url);
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
  }
  if (OPEN.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return NextResponse.next();
  if (!session) return NextResponse.next();
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: { plan: true, trialEndsAt: true, paidUntil: true, createdAt: true },
  });
  if (!workspace || accessOf(workspace) !== "expired") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard/plan";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/dashboard/:path*"] };
