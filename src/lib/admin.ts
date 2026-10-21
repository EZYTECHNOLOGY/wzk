import { prisma } from "./db";

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export async function isAdminUser(userId: string, email: string) {
  if (adminEmail() && email.toLowerCase() === adminEmail()) return true;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return Boolean(user?.isAdmin);
}
