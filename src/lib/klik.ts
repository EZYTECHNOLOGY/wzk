import type { KlikNumber, Strategy } from "@prisma/client";
import { prisma } from "./db";
import { ownersPaused } from "./pause";
import { accessOf } from "./plans";

export const E164_RE = /^\+[1-9]\d{6,14}$/;

export function normalizeE164(raw: string): string | null {
  const trimmed = raw.replace(/[\s()-]/g, "");
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  return E164_RE.test(withPlus) ? withPlus : null;
}

export function waUrl(phoneE164: string, prefill: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  const text = prefill.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Never-clicked numbers sort first. Equal click times keep the list order of `targets`. */
export function pickOldestClick<T extends { id: string }>(targets: T[], lastClickMs: ReadonlyMap<string, number>): T | null {
  if (targets.length === 0) return null;
  let best = targets[0];
  let bestAt = lastClickMs.get(best.id) ?? Number.NEGATIVE_INFINITY;
  for (let i = 1; i < targets.length; i++) {
    const at = lastClickMs.get(targets[i].id) ?? Number.NEGATIVE_INFINITY;
    if (at < bestAt) {
      best = targets[i];
      bestAt = at;
    }
  }
  return best;
}

export function pickWeighted<T extends { weight: number }>(targets: T[], random = Math.random()): T | null {
  if (targets.length === 0) return null;
  const total = targets.reduce((s, t) => s + Math.max(0, t.weight), 0);
  if (total <= 0) return targets[0];
  let r = Math.min(Math.max(random, 0), 0.999999) * total;
  for (const t of targets) {
    r -= Math.max(0, t.weight);
    if (r < 0) return t;
  }
  return targets[targets.length - 1];
}

function hourInZone(date: Date, timeZone: string): { hour: number; day: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { hour: Number(get("hour")), day: `${get("year")}-${get("month")}-${get("day")}` };
}

function inHours(n: KlikNumber, hour: number): boolean {
  if (n.hourStart == null || n.hourEnd == null) return true;
  const start = n.hourStart;
  const end = n.hourEnd;
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export type RouteInput = {
  slug: string;
  stickyId?: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  device?: string;
  country?: string;
};

export type RouteResult =
  | { ok: true; url: string; stickyDays: number; numberId: string }
  | { ok: false; reason: "missing" | "paused" | "none" | "expired" };

export async function routeKlik(input: RouteInput): Promise<RouteResult> {
  const link = await prisma.klikLink.findUnique({
    where: { slug: input.slug },
    include: { workspace: true },
  });
  if (!link) return { ok: false, reason: "missing" };
  if (!link.isActive) return { ok: false, reason: "paused" };
  if (await ownersPaused(link.workspaceId)) return { ok: false, reason: "paused" };
  if (accessOf(link.workspace) === "expired") return { ok: false, reason: "expired" };
  const { hour, day } = hourInZone(new Date(), link.workspace.timezone || "UTC");

  const chosen = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "KlikLink" WHERE "id" = ${link.id} FOR UPDATE`;
    const numbers = await tx.klikNumber.findMany({
      where: { linkId: link.id },
      orderBy: [{ label: "asc" }, { id: "asc" }],
    });
    const eligible = numbers.filter((n) => {
      if (!n.isActive) return false;
      if (!inHours(n, hour)) return false;
      if (n.dailyCap > 0 && n.capDay === day && n.capCount >= n.dailyCap) return false;
      return true;
    });
    if (eligible.length === 0) return null;

    let pick = input.stickyId ? eligible.find((n) => n.id === input.stickyId) : undefined;
    if (!pick) {
      if (link.strategy === "WEIGHTED") {
        pick = pickWeighted(eligible) ?? undefined;
      } else {
        const latest = await tx.klikEvent.groupBy({
          by: ["numberId"],
          where: { linkId: link.id, numberId: { in: eligible.map((n) => n.id) } },
          _max: { createdAt: true },
        });
        const lastClickMs = new Map<string, number>();
        for (const row of latest) {
          if (row._max.createdAt) lastClickMs.set(row.numberId, row._max.createdAt.getTime());
        }
        pick = pickOldestClick(eligible, lastClickMs) ?? undefined;
      }
    }
    if (!pick) return null;

    const nextCap = pick.capDay === day ? pick.capCount + 1 : 1;
    await tx.klikEvent.create({
      data: {
        linkId: link.id,
        numberId: pick.id,
        utmSource: input.utmSource.slice(0, 80),
        utmMedium: input.utmMedium.slice(0, 80),
        utmCampaign: input.utmCampaign.slice(0, 80),
        device: (input.device || "").slice(0, 20),
        country: (input.country || "").slice(0, 8),
      },
    });
    await tx.klikNumber.update({
      where: { id: pick.id },
      data: { startsCount: { increment: 1 }, capDay: day, capCount: nextCap },
    });
    return pick;
  });

  if (!chosen) return { ok: false, reason: "none" };
  return { ok: true, url: waUrl(chosen.phoneE164, link.prefill), stickyDays: link.stickyDays, numberId: chosen.id };
}

export function adUrl(origin: string, slug: string, utm: { source: string; medium: string; campaign: string }): string {
  const u = new URL(`/r/${slug}`, origin);
  if (utm.source) u.searchParams.set("utm_source", utm.source);
  if (utm.medium) u.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
  return u.toString();
}

export type { Strategy };
