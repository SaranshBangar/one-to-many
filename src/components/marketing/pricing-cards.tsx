"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { PLAN_LIST, annualPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingCards({
  signedIn,
  currentTier,
}: {
  signedIn: boolean;
  currentTier?: string;
}) {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function choose(tier: string) {
    if (!signedIn) {
      router.push(`/sign-up?plan=${tier}`);
      return;
    }
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval: annual ? "annual" : "monthly" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.assign(data.url);
    } catch (e) {
      toast((e as Error).message, "error");
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !annual && "text-foreground", annual && "text-muted")}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            annual ? "bg-accent" : "bg-surface-2",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              annual ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
        <span className={cn("text-sm", annual && "text-foreground", !annual && "text-muted")}>
          Annual <span className="text-accent">−20%</span>
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_LIST.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const price = annual
            ? Math.round(annualPrice(plan.priceMonthly) / 12)
            : plan.priceMonthly;
          return (
            <div
              key={plan.tier}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-card)] border bg-surface p-6",
                plan.highlight
                  ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
                  : "border-border",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6">
                  <Badge variant="accent">Most popular</Badge>
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              <div className="mt-4 flex items-baseline gap-1">
                {price === 0 ? (
                  <span className="text-4xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">₹{price}</span>
                    <span className="text-sm text-muted">/mo</span>
                  </>
                )}
              </div>
              {annual && price > 0 && (
                <p className="mt-1 text-xs text-muted">
                  ₹{annualPrice(plan.priceMonthly)} billed yearly
                </p>
              )}
              <ul className="my-6 flex flex-1 flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "primary" : "secondary"}
                size="lg"
                loading={loading === plan.tier}
                disabled={isCurrent}
                onClick={() => choose(plan.tier)}
              >
                {isCurrent
                  ? "Current plan"
                  : signedIn
                    ? `Choose ${plan.name}`
                    : "Start free trial"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
