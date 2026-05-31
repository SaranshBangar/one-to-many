import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/lib/admin";

// Admin reads live user + DB state every request; never cache.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  // Non-admins (and signed-out users) never see admin — bounce to the app.
  if (!admin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-accent" />
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.1em]">
            Admin
          </span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to app
        </Link>
      </header>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
