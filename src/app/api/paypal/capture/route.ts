import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { PayError, settlePaypalOrder } from "@/lib/paypal-settle";

export async function POST(req: Request) {
  const session = await getSession();
  const parsed = z.object({ orderId: z.string().min(4) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing PayPal order." }, { status: 400 });

  try {
    const result = await settlePaypalOrder(parsed.data.orderId, session?.workspaceId ?? null);
    return NextResponse.json({ ok: true, paidUntil: result.paidUntil });
  } catch (error) {
    if (error instanceof PayError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
