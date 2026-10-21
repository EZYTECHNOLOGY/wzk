import { readLang } from "@/lib/read-lang";
import { deskCopy } from "@/lib/desk-copy";

export default async function OfflinePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const t = deskCopy[await readLang()].offline;
  const body = reason === "paused" ? t.paused : reason === "none" ? t.none : reason === "expired" ? t.expired : t.missing;
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ae6ff]">{t.eyebrow}</p>
      <h1 className="mt-4 text-3xl font-extrabold">{t.title}</h1>
      <p className="mt-4 text-[#b3b3bf]">{body}</p>
    </main>
  );
}
