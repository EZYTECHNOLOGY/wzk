import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthScreen from "@/components/auth/AuthScreen";
import type { Lang } from "@/lib/home-copy";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const jar = await cookies();
  const lang: Lang = jar.get("wzk_lang")?.value === "en" ? "en" : "he";
  const query = await searchParams;
  return <AuthScreen mode="login" initialLang={lang} paid={query.paid === "1"} />;
}
