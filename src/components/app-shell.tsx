"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme";
import { Avatar } from "./ui/platform";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/upload", label: "New piece", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  firstName,
  planName,
  authLive,
  isAdmin = false,
  children,
}: {
  firstName: string;
  planName: string;
  authLive: boolean;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = isAdmin
    ? [...NAV, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-muted hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo href="/dashboard" />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">
            Welcome, {firstName}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-20 w-56 border-r border-border bg-surface p-3 transition-transform md:static md:inset-y-0 md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex h-full flex-col gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
            <div className="mt-auto">
              <LogoutLink authLive={authLive} />
            </div>
            <div className="mt-2 flex items-center gap-2.5 border-t border-border px-2 pt-3">
              <Avatar
                initials={firstName.slice(0, 2).toUpperCase()}
                size={34}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-semibold">
                  {firstName}
                </span>
                <span className="font-mono text-[11px] text-muted-2">
                  {planName} plan
                </span>
              </div>
            </div>
          </nav>
        </aside>

        {/* Backdrop on mobile */}
        {open && (
          <div
            className="fixed inset-0 top-14 z-10 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function LogoutLink({ authLive }: { authLive: boolean }) {
  const cls =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground";
  if (!authLive) {
    return (
      <Link href="/" className={cls}>
        <LogOut size={18} /> Exit demo
      </Link>
    );
  }
  // Live Clerk sign-out.
  return (
    <a href="/sign-out" className={cls}>
      <LogOut size={18} /> Logout
    </a>
  );
}
