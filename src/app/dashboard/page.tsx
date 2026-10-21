import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { readLang } from "@/lib/read-lang";
import { deskCopy } from "@/lib/desk-copy";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const session = await getSession();
  const lang = await readLang();
  const t = deskCopy[lang].overview;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [workspace, kliks30, kliksToday, leads, openEvents, links] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: session!.workspaceId } }),
    prisma.klikEvent.count({ where: { link: { workspaceId: session!.workspaceId }, createdAt: { gte: since } } }),
    prisma.klikEvent.count({ where: { link: { workspaceId: session!.workspaceId }, createdAt: { gte: today } } }),
    prisma.klikLead.count({ where: { workspaceId: session!.workspaceId, createdAt: { gte: since } } }),
    prisma.klikEvent.count({ where: { link: { workspaceId: session!.workspaceId }, status: "OPEN" } }),
    prisma.klikLink.count({ where: { workspaceId: session!.workspaceId, isActive: true } }),
  ]);

  return (
    <>
      <p className="crumb">{t.crumb}</p>
      <p className="eyebrow">Who Ze Klik</p>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="page">{t.title}</h1>
        <Link href="/dashboard/routing" className="btn">{t.newLink}</Link>
      </div>
      <p className="lede">{t.lede(workspace?.name ?? "")}</p>
      <section className="kpis">
        <article className="kpi"><span>{t.today}</span><b>{kliksToday}</b></article>
        <article className="kpi"><span>{t.month}</span><b>{kliks30}</b></article>
        <article className="kpi"><span>{t.open}</span><b>{openEvents}</b></article>
        <article className="kpi"><span>{t.added}</span><b>{leads}</b></article>
      </section>
      <section className="grid-2">
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{t.what}</h2>
          <p className="muted">{t.whatBody}</p>
          <p style={{ marginBottom: 0 }}>{t.live(links)}</p>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>{t.next}</h2>
          <div className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <Link href="/dashboard/routing" className="btn ghost">{t.numbers}</Link>
            <Link href="/dashboard/desk" className="btn ghost">{t.review}</Link>
            <Link href="/dashboard/followups" className="btn ghost">{t.follow}</Link>
          </div>
        </article>
      </section>
    </>
  );
}
