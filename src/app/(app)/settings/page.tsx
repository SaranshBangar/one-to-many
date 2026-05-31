import { getSessionUser } from "@/lib/session";
import { PLANS } from "@/lib/plans";
import { SettingsView } from "@/components/settings-view";

type Tab = "account" | "billing" | "tone";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; upgraded?: string }>;
}) {
  const user = (await getSessionUser())!;
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "billing" || sp.tab === "tone"
      ? sp.tab
      : sp.upgraded
        ? "billing"
        : "account";

  return (
    <SettingsView
      user={{
        email: user.email,
        firstName: user.firstName,
        plan: user.plan,
        defaultTone: user.defaultTone,
      }}
      planName={PLANS[user.plan].name}
      toneEnabled={PLANS[user.plan].toneSelector}
      initialTab={tab}
      justUpgraded={sp.upgraded}
    />
  );
}
