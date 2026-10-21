import Link from "next/link";
import { prisma } from "@/lib/db";
import AcceptButton from "./AcceptButton";
import { readLang } from "@/lib/read-lang";
import { deskCopy } from "@/lib/desk-copy";
import { CookieLangSwitch } from "@/components/LangProvider";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = await readLang();
  const t = deskCopy[lang].invite;
  const invite = await prisma.invite.findUnique({ where: { token }, include: { workspace: true } });
  if (!invite || invite.expiresAt < new Date()) {
    return (
      <main className="main">
        <CookieLangSwitch lang={lang} />
        <h1 className="page">{t.expired}</h1>
      </main>
    );
  }
  return (
    <main className="main" style={{ maxWidth: 560 }}>
      <CookieLangSwitch lang={lang} />
      <p className="eyebrow">Who Ze Klik</p>
      <h1 className="page">{t.join(invite.workspace.name)}</h1>
      <p className="lede">{t.lede(invite.email)}</p>
      <div className="row">
        <Link className="btn ghost" href="/login">{t.login}</Link>
        <Link className="btn ghost" href="/signup">{t.signup}</Link>
      </div>
      <AcceptButton token={token} label={t.accept} lang={lang} />
    </main>
  );
}
