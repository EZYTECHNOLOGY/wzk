import { prisma } from "@/lib/db";

export type PaypalConfig = {
  env: "sandbox" | "live";
  clientId: string;
  clientSecret: string;
  cardEnabled: boolean;
};

type Row = { env: string; clientId: string; clientSecret: string; cardEnabled: boolean };

function fromEnv(): PaypalConfig {
  return {
    env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    clientId: process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    cardEnabled: true,
  };
}

export async function readPaypalConfig(): Promise<PaypalConfig> {
  try {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT env, "clientId", "clientSecret", "cardEnabled"
      FROM "PaymentConfig"
      WHERE id = 'paypal'
    `;
    const row = rows[0];
    if (!row) return fromEnv();
    const envFallback = fromEnv();
    return {
      env: row.env === "live" ? "live" : row.env === "sandbox" ? "sandbox" : envFallback.env,
      clientId: row.clientId || envFallback.clientId,
      clientSecret: row.clientSecret || envFallback.clientSecret,
      cardEnabled: row.cardEnabled,
    };
  } catch {
    return fromEnv();
  }
}

async function credentialsMatch(env: "sandbox" | "live", clientId: string, clientSecret: string) {
  const base = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  return res.ok;
}

export async function savePaypalConfig(input: PaypalConfig) {
  const current = await readPaypalConfig();
  const secret = input.clientSecret || current.clientSecret;
  let env = input.env;
  if (!(await credentialsMatch(env, input.clientId, secret))) {
    const other = env === "live" ? "sandbox" : "live";
    if (await credentialsMatch(other, input.clientId, secret)) env = other;
  }
  await prisma.$executeRaw`
    INSERT INTO "PaymentConfig" (id, env, "clientId", "clientSecret", "cardEnabled")
    VALUES ('paypal', ${env}, ${input.clientId}, ${secret}, ${input.cardEnabled})
    ON CONFLICT (id) DO UPDATE SET
      env = EXCLUDED.env,
      "clientId" = EXCLUDED."clientId",
      "clientSecret" = EXCLUDED."clientSecret",
      "cardEnabled" = EXCLUDED."cardEnabled"
  `;
}
