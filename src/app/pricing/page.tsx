import Link from "next/link";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { getSessionUser } from "@/lib/session";

export default async function PricingPage() {
  const user = await getSessionUser();
  return (
    <div>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={user ? "/dashboard" : "/sign-in"}>
              <Button size="sm" variant="secondary">
                {user ? "Dashboard" : "Sign in"}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          Pricing
        </h1>
        <p className="mt-3 text-center text-muted">
          7-day free trial. No credit card. Cancel anytime.
        </p>
        <div className="mt-10">
          <PricingCards signedIn={!!user} currentTier={user?.plan} />
        </div>
      </main>
    </div>
  );
}
