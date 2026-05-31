import { Users, IndianRupee, Layers, CreditCard } from "lucide-react";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { effectiveUsage } from "@/lib/usage";
import { Card } from "@/components/ui/card";
import { AdminView, type AdminUserRow } from "@/components/admin-view";

export default async function AdminPage() {
  const db = await getDb();
  const [users, projects] = await Promise.all([
    db.listUsers(),
    db.listAllProjects(),
  ]);

  // Project count per user — single pass.
  const projectsByUser = new Map<string, number>();
  for (const p of projects) {
    projectsByUser.set(p.userId, (projectsByUser.get(p.userId) ?? 0) + 1);
  }

  const rows: AdminUserRow[] = users.map((u) => {
    const usage = effectiveUsage(u);
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      plan: u.plan,
      usageCount: u.usageCount,
      usageMonth: u.usageMonth,
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      projectCount: projectsByUser.get(u.id) ?? 0,
      stripeCustomerId: u.stripeCustomerId,
      createdAt: u.createdAt,
    };
  });

  const paidUsers = users.filter((u) => u.plan !== "free");
  // Estimated monthly recurring revenue — sum of each paid user's plan price.
  // No real payment ledger exists, so this is an estimate, not booked revenue.
  const estMrr = paidUsers.reduce((sum, u) => sum + PLANS[u.plan].priceMonthly, 0);

  const planCounts = (["free", "starter", "pro", "max"] as const).map((tier) => ({
    tier,
    name: PLANS[tier].name,
    count: users.filter((u) => u.plan === tier).length,
  }));

  const stats = [
    { icon: Users, label: "Total users", value: String(users.length) },
    { icon: CreditCard, label: "Paying users", value: String(paidUsers.length) },
    { icon: IndianRupee, label: "Est. MRR", value: `₹${estMrr.toLocaleString("en-IN")}` },
    { icon: Layers, label: "Total projects", value: String(projects.length) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
          Operator console
        </span>
        <h1 className="display text-3xl">Users &amp; revenue</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted">
              <Icon size={16} className="text-accent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                {label}
              </span>
            </div>
            <span className="display text-[32px] leading-none">{value}</span>
          </Card>
        ))}
      </div>

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
        {planCounts.map((p) => (
          <div key={p.tier} className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{p.count}</span>
            <span className="text-sm text-muted">{p.name}</span>
          </div>
        ))}
        <span className="ml-auto font-mono text-[11px] text-muted-2">
          Est. annualized: ₹{(estMrr * 12).toLocaleString("en-IN")}
        </span>
      </Card>

      <AdminView rows={rows} />
    </div>
  );
}
