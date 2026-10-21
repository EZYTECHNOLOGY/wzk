import { cookies } from "next/headers";
import type { Lang } from "@/lib/home-copy";

export async function readLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get("wzk_lang")?.value === "en" ? "en" : "he";
}
