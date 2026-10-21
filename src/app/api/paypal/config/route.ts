import { NextResponse } from "next/server";
import { readPaypalConfig } from "@/lib/paypal-config";

export async function GET() {
  const config = await readPaypalConfig();
  const ready = Boolean(config.clientId && config.clientSecret);
  return NextResponse.json({
    clientId: ready ? config.clientId : "",
    env: config.env,
    cardEnabled: config.cardEnabled,
    ready,
  });
}
