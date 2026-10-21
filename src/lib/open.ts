import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { accessOf } from "@/lib/plans";

export async function closedWorkspaceResponse(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, trialEndsAt: true, paidUntil: true, createdAt: true },
  });
  if (workspace && accessOf(workspace) === "expired") {
    return NextResponse.json(
      { error: "The trial week has ended. Pay once to open the Agency plan for 3 years." },
      { status: 402 },
    );
  }
  return null;
}
