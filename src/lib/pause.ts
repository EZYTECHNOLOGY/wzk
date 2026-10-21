import { prisma } from "@/lib/db";

/** Public kliks stop when every owner of the workspace is paused. */
export async function ownersPaused(workspaceId: string) {
  const owners = await prisma.membership.findMany({
    where: { workspaceId, role: "OWNER" },
    select: { user: { select: { pausedAt: true } } },
  });
  return owners.length > 0 && owners.every((seat) => seat.user.pausedAt != null);
}
