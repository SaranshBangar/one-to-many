import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isClerkConfigured } from "@/lib/env";
import { isAdmin } from "@/lib/admin";
import { PLANS } from "@/lib/plans";
import { AppShell } from "@/components/app-shell";

// Authed pages read per-request user + DB state, never cache them.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return (
    <AppShell
      firstName={user.firstName}
      planName={PLANS[user.plan].name}
      authLive={isClerkConfigured}
      isAdmin={isAdmin(user.email)}
    >
      {children}
    </AppShell>
  );
}
