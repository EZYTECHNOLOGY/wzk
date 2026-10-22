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

type Money = { currency_code?: string; value?: string };

export type Capture = {
  status?: string;
  update_time?: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: Money;
    payments?: { captures?: Array<{ status?: string; create_time?: string; update_time?: string; amount?: Money }> };
  }>;
};

export type PaidReceipt = {
  orderStatus: string;
  captureStatus: string;
  orderCurrency: string;
  orderValue: string;
  captureCurrency: string;
  captureValue: string;
  workspaceId: string;
  paidAt: string;
};

export async function fetchPaypalOrder(orderId: string): Promise<Capture> {
  const { access, env } = await token();
  const got = await fetch(`${baseUrl(env)}/v2/checkout/orders/${orderId}`, { headers: { Authorization: `Bearer ${access}` } });
  if (!got.ok) throw new Error("PayPal did not capture this payment");
  return (await got.json()) as Capture;
}

export async function capturePaypalOrder(orderId: string): Promise<Capture> {
  const { access, env } = await token();
  const res = await fetch(`${baseUrl(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
  });
  const json = (await res.json()) as Capture & { name?: string; details?: Array<{ issue?: string }> };
  const already = json.details?.some((d) => d.issue === "ORDER_ALREADY_CAPTURED");
  if (already) return fetchPaypalOrder(orderId);
  if (!res.ok) throw new Error("PayPal did not capture this payment");
  return json;
}

export function paidAmount(capture: Capture): PaidReceipt {
  const unit = capture.purchase_units?.[0];
  const payment = unit?.payments?.captures?.[0];
  return {
    orderStatus: capture.status || "",
    captureStatus: payment?.status || "",
    orderCurrency: unit?.amount?.currency_code || "",
    orderValue: unit?.amount?.value || "",
    captureCurrency: payment?.amount?.currency_code || "",
    captureValue: payment?.amount?.value || "",
    workspaceId: unit?.custom_id || "",
    paidAt: payment?.create_time || payment?.update_time || capture.update_time || "",
  };
}

function sameMoney(currency: string, value: string, expectedCurrency: string, expectedAmount: string) {
  if (!currency || value === "") return false;
  const got = Math.round(Number(value) * 100);
  const expected = Math.round(Number(expectedAmount) * 100);
  return currency.toUpperCase() === expectedCurrency.toUpperCase() && got === expected;
}

/** Card receipts can show the seller's converted currency. The order amount is what the buyer was charged. */
export function receiptMatches(paid: PaidReceipt, expected: { amount: string; currency: string; workspaceId: string }) {
  const completed = paid.orderStatus === "COMPLETED" || paid.captureStatus === "COMPLETED";
  const owner = !paid.workspaceId || paid.workspaceId === expected.workspaceId;
  if (!completed || !owner) return false;
  const known = [
    { currency: paid.captureCurrency, value: paid.captureValue },
    { currency: paid.orderCurrency, value: paid.orderValue },
  ].filter((row) => row.currency);
  if (known.length === 0) return false;
  const quoted = known.some((row) => row.currency.toUpperCase() === expected.currency.toUpperCase());
  if (!quoted) return true;
  return known.some((row) => sameMoney(row.currency, row.value, expected.currency, expected.amount));
}
