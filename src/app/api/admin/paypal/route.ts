import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { readPaypalConfig, savePaypalConfig } from "@/lib/paypal-config";

async function guard() {
  const session = await getSession();
  if (!session) return false;
  return isAdminUser(session.userId, session.email);
}

function view(config: Awaited<ReturnType<typeof readPaypalConfig>>) {
  return {
    env: config.env,
    clientId: config.clientId,
    cardEnabled: config.cardEnabled,
    secretSet: Boolean(config.clientSecret),
    ready: Boolean(config.clientId && config.clientSecret),
  };
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  return NextResponse.json(view(await readPaypalConfig()));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = z
    .object({
      env: z.enum(["sandbox", "live"]),
      clientId: z.string().trim().min(8).max(200),
      clientSecret: z.string().max(200).optional(),
      cardEnabled: z.boolean(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "PayPal client ID is required." }, { status: 400 });
  const current = await readPaypalConfig();
  const secret = (parsed.data.clientSecret || "").trim();
  if (!secret && !current.clientSecret) return NextResponse.json({ error: "PayPal secret is required." }, { status: 400 });
  await savePaypalConfig({
    env: parsed.data.env,
    clientId: parsed.data.clientId,
    clientSecret: secret,
    cardEnabled: parsed.data.cardEnabled,
  });
  return NextResponse.json(view(await readPaypalConfig()));
}
