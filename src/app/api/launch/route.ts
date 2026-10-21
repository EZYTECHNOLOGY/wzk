import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LAUNCH_STOCK_DEFAULT } from "@/lib/plans";

export async function GET() {
  const stock = await prisma.launchStock.upsert({
    where: { id: "launch" },
    update: {},
    create: { id: "launch", remaining: LAUNCH_STOCK_DEFAULT },
  });
  return NextResponse.json({ remaining: stock.remaining });
}
