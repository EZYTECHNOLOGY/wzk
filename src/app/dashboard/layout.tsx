import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import Shell from "@/components/Shell";
import { LangProvider } from "@/components/LangProvider";
import { readLang } from "@/lib/read-lang";
import { accessOf } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) redirect("/login");
  const admin = await isAdminUser(session.userId, session.email);
  const seats = await prisma.membership.findMany({
    where: { userId: session.userId },
    select: { workspace: { select: { id: true, name: true } } },
    orderBy: { workspace: { name: "asc" } },
  });
  const lang = await readLang();
  return (
    <LangProvider initialLang={lang}>
      <Shell
        email={session.email}
        name={workspace.name}
        plan={workspace.plan}
        isAdmin={admin}
        locked={accessOf(workspace) === "expired"}
        workspaceId={workspace.id}
        workspaces={seats.map((seat) => seat.workspace)}
      >
        {children}
      </Shell>
    </LangProvider>
  );
}
