"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, CreditCard, Mic, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { TONES, TONE_KEYS } from "@/lib/content";
import type { PlanTier, Tone } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type Tab = "account" | "billing" | "tone";
const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "tone", label: "Tone profiles", icon: Mic },
];

export function SettingsView({
  user,
  planName,
  toneEnabled,
  initialTab,
  justUpgraded,
}: {
  user: {
    email: string;
    firstName: string;
    plan: PlanTier;
    defaultTone: Tone;
  };
  planName: string;
  toneEnabled: boolean;
  initialTab: Tab;
  justUpgraded?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [tone, setTone] = useState<Tone>(user.defaultTone);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function saveTone(next: Tone) {
    setTone(next);
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultTone: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Default tone saved", "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {justUpgraded && (
        <Card className="border-success/40 bg-success/10">
          <p className="text-sm">
            🎉 You&apos;re now on <strong className="capitalize">{justUpgraded}</strong>.
            Changes apply immediately.
          </p>
        </Card>
      )}

      <div className="flex gap-2 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <Card className="space-y-4">
          <Field label="Name" value={user.firstName} />
          <Field label="Email" value={user.email} />
          <div className="border-t border-border pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                toast("Account deletion is disabled in this demo.", "info")
              }
            >
              Delete account
            </Button>
          </div>
        </Card>
      )}

      {tab === "billing" && (
        <div className="space-y-5">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="text-lg font-semibold">{planName}</p>
            </div>
            <Badge variant="accent">Active</Badge>
          </Card>
          <h2 className="text-sm font-semibold text-muted">Change plan</h2>
          <PricingCards signedIn currentTier={user.plan} />
        </div>
      )}

      {tab === "tone" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Your default voice, applied to every new piece.
            {!toneEnabled && " Upgrade to Pro to switch tones."}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {TONE_KEYS.map((t) => (
              <button
                key={t}
                disabled={(!toneEnabled && t !== "authentic") || saving}
                onClick={() => saveTone(t)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors disabled:opacity-40",
                  tone === t
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-muted-2",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{TONES[t].label}</span>
                  {tone === t && <Check size={16} className="text-accent" />}
                </div>
                <p className="mt-1 text-xs text-muted">{TONES[t].description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
