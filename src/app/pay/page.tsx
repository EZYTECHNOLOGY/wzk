import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PayGuest from "@/components/pay/PayGuest";
import type { Lang } from "@/lib/home-copy";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PayPage({ searchParams }: { searchParams: Promise<{ paypal?: string }> }) {
  if (await getSession()) redirect("/dashboard/plan");
  const jar = await cookies();
  const lang: Lang = jar.get("wzk_lang")?.value === "en" ? "en" : "he";
  const query = await searchParams;
  return <PayGuest initialLang={lang} failed={query.paypal === "error"} />;
}
