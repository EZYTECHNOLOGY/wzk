import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { settlePaypalOrder } from "@/lib/paypal-settle";

export const dynamic = "force-dynamic";

export default async function PaypalReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; paypal?: string }>;
}) {
  const query = await searchParams;
  if (query.paypal === "cancel" || !query.token) redirect("/pay");
  try {
    await settlePaypalOrder(query.token, null);
  } catch {
    redirect("/pay?paypal=error");
  }
  const session = await getSession();
  redirect(session ? "/dashboard/plan?paid=1" : "/login?paid=1");
}
