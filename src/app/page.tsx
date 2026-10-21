import { cookies } from "next/headers";
import HomePage from "@/components/home/HomePage";
import type { Lang } from "@/lib/home-copy";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const jar = await cookies();
  const lang: Lang = jar.get("wzk_lang")?.value === "en" ? "en" : "he";
  const session = await getSession();
  return <HomePage initialLang={lang} signedIn={Boolean(session)} />;
}
