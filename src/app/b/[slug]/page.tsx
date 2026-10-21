import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { readLang } from "@/lib/read-lang";
import { deskCopy } from "@/lib/desk-copy";
import { ownersPaused } from "@/lib/pause";
import { accessOf } from "@/lib/plans";

export default async function ButtonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await prisma.klikLink.findUnique({ where: { slug }, include: { workspace: true } });
  if (!link || !link.isActive || accessOf(link.workspace) === "expired" || (await ownersPaused(link.workspaceId))) notFound();
  const word = deskCopy[await readLang()].button;
  return (
    <main className="main" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <a className="btn home-cta" href={`/r/${link.slug}`}>
        {word} · {link.name}
      </a>
    </main>
  );
}
