import { prisma } from "@/lib/db";

type Lang = "he" | "en";

function mailgunReady() {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

export async function sendMail(input: { to: string; subject: string; text: string }) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain) return { sent: false as const };
  const from = process.env.MAILGUN_FROM || `Who Ze Klik <postmaster@${domain}>`;
  const base = (process.env.MAILGUN_API_BASE || "https://api.mailgun.net").replace(/\/$/, "");
  const body = new URLSearchParams({ from, to: input.to, subject: input.subject, text: input.text });
  try {
    const res = await fetch(`${base}/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` },
      body,
    });
    if (!res.ok) console.error("mailgun status", res.status);
    return { sent: res.ok as boolean };
  } catch (error) {
    console.error("mailgun", error instanceof Error ? error.message : "failed");
    return { sent: false as const };
  }
}

export async function sendSignupMail(input: { to: string; name: string; lang: Lang }) {
  const he = input.lang !== "en";
  const subject = he ? "Who Ze Klik — הדסק נפתח" : "Who Ze Klik — your desk is open";
  const text = he
    ? `שלום ${input.name},\n\nהחשבון נפתח. יש לכם שבוע ניסיון: 3 קישורים ו-5 מושבי וואטסאפ.\nאחרי השבוע, בלי תשלום, הדסק ננעל עד לרכישת 3 השנים.\n\nכניסה: https://wzk.io/login\n`
    : `Hello ${input.name},\n\nYour account is open. You have a one-week trial: 3 links and 5 WhatsApp seats.\nAfter that week, without a payment, the desk locks until you buy the 3 years.\n\nLog in: https://wzk.io/login\n`;
  return sendMail({ to: input.to, subject, text });
}

export async function sendPurchaseMail(workspaceId: string, paidUntil: Date) {
  const owner = await prisma.membership.findFirst({
    where: { workspaceId, role: "OWNER" },
    include: { user: true, workspace: true },
  });
  if (!owner) return { sent: false as const };
  const until = paidUntil.toLocaleDateString("he-IL");
  const subject = "Who Ze Klik — התשלום התקבל";
  const text = `שלום ${owner.user.name},\n\nהתשלום התקבל עבור ${owner.workspace.name}.\nתוכנית Agency פתוחה עד ${until}. זה שלוש שנים, בלי מנוי, והדסק לא ננעל.\n\nכניסה: https://wzk.io/login\n\nHello ${owner.user.name},\nPayment received for ${owner.workspace.name}.\nAgency is open until ${until}. Three years, no subscription, and the desk stays open.\n`;
  return sendMail({ to: owner.user.email, subject, text });
}
