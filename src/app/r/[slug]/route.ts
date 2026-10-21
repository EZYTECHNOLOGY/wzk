import { NextResponse } from "next/server";
import { routeKlik } from "@/lib/klik";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const sticky = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )wzk_stick_${slug}=([^;]+)`))?.[1];
  const ua = req.headers.get("user-agent") || "";
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";
  const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "";
  const result = await routeKlik({
    slug,
    stickyId: sticky ? decodeURIComponent(sticky) : null,
    utmSource: url.searchParams.get("utm_source") ?? "",
    utmMedium: url.searchParams.get("utm_medium") ?? "",
    utmCampaign: url.searchParams.get("utm_campaign") ?? "",
    device,
    country,
  });
  if (!result.ok) {
    const offline = new URL("/offline", url.origin);
    offline.searchParams.set("reason", result.reason);
    return NextResponse.redirect(offline);
  }
  const res = NextResponse.redirect(result.url);
  if (result.stickyDays > 0) {
    res.cookies.set(`wzk_stick_${slug}`, result.numberId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: result.stickyDays * 24 * 60 * 60,
    });
  }
  return res;
}
