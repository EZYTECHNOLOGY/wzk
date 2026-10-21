import { priceFor } from "./plans";
import { readPaypalConfig } from "./paypal-config";

function baseUrl(env: "sandbox" | "live") {
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function paypalConfigured() {
  const config = await readPaypalConfig();
  return Boolean(config.clientId && config.clientSecret);
}

async function token(): Promise<{ access: string; env: "sandbox" | "live" }> {
  const config = await readPaypalConfig();
  const id = config.clientId;
  const secret = config.clientSecret;
  if (!id || !secret) throw new Error("PayPal is not configured");
  const res = await fetch(`${baseUrl(config.env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string };
  if (!res.ok || !json.access_token) throw new Error("PayPal login failed");
  return { access: json.access_token, env: config.env };
}

export async function createPaypalOrder(input: {
  currency: "ILS" | "USD";
  workspaceId: string;
  returnUrl: string;
  cancelUrl: string;
  amount?: string;
}) {
  const price = input.amount ? { currency: input.currency, value: input.amount } : priceFor(input.currency);
  const { access, env } = await token();
  const res = await fetch(`${baseUrl(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      application_context: {
        brand_name: "Who Ze Klik",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
      purchase_units: [
        {
          custom_id: input.workspaceId,
          description: "Who Ze Klik Agency — 3 years",
          amount: { currency_code: price.currency, value: price.value },
        },
      ],
    }),
  });
  const json = (await res.json()) as {
    id?: string;
    message?: string;
    links?: Array<{ rel?: string; href?: string }>;
  };
  const approve = json.links?.find((link) => link.rel === "payer-action") || json.links?.find((link) => link.rel === "approve");
  if (!res.ok || !json.id || !approve?.href) throw new Error(json.message || "Could not start PayPal");
  return { id: json.id, approveUrl: approve.href };
}

type Capture = {
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: { captures?: Array<{ status?: string; amount?: { currency_code?: string; value?: string } }> };
  }>;
};

export async function capturePaypalOrder(orderId: string): Promise<Capture> {
  const { access, env } = await token();
  const res = await fetch(`${baseUrl(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
  });
  const json = (await res.json()) as Capture & { name?: string; details?: Array<{ issue?: string }> };
  const already = json.details?.some((d) => d.issue === "ORDER_ALREADY_CAPTURED");
  if (already) {
    const got = await fetch(`${baseUrl(env)}/v2/checkout/orders/${orderId}`, { headers: { Authorization: `Bearer ${access}` } });
    return (await got.json()) as Capture;
  }
  if (!res.ok) throw new Error("PayPal did not capture this payment");
  return json;
}

export function paidAmount(capture: Capture) {
  const unit = capture.purchase_units?.[0];
  const payment = unit?.payments?.captures?.[0];
  return {
    status: payment?.status || capture.status || "",
    currency: payment?.amount?.currency_code || "",
    value: payment?.amount?.value || "",
    workspaceId: unit?.custom_id || "",
  };
}
