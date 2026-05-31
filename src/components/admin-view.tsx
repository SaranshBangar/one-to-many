"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { PLAN_LIST } from "@/lib/plans";
import type { PlanTier } from "@/lib/db/types";
import { formatDate } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  email: string;
  firstName: string;
  plan: PlanTier;
  usageCount: number;
  usageMonth: string;
  used: number;
  limit: number;
  remaining: number;
  projectCount: number;
  stripeCustomerId: string | null;
  createdAt: string;
};

export function AdminView({ rows }: { rows: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q),
      )
    : rows;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-[18px]">
        <span className="font-semibold">All users ({rows.length})</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or name…"
          className="h-9 w-56 rounded-[var(--radius-sm)] border border-border bg-surface-3 px-3 text-[13px] text-foreground placeholder:text-muted-2 focus:border-[var(--accent-line)] focus:outline-none"
        />
      </div>

      <div className="hidden gap-4 border-b border-border px-6 py-3 font-mono text-[11px] tracking-[0.08em] text-muted-2 md:flex">
        <span className="flex-1">USER</span>
        <span className="w-[130px]">PLAN</span>
        <span className="w-[150px]">USAGE THIS MONTH</span>
        <span className="w-[70px]">PROJECTS</span>
        <span className="w-[90px]">JOINED</span>
        <span className="w-[80px]" />
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No users match.
          </p>
        ) : (
          filtered.map((row) => <UserRow key={row.id} row={row} />)
        )}
      </div>
    </Card>
  );
}

function UserRow({ row }: { row: AdminUserRow }) {
  const router = useRouter();
  const toast = useToast();
  const [plan, setPlan] = useState<PlanTier>(row.plan);
  const [usageCount, setUsageCount] = useState<number>(row.usageCount);
  const [saving, setSaving] = useState(false);

  const dirty = plan !== row.plan || usageCount !== row.usageCount;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, usageCount }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error ?? "Save failed");
      }
      toast(`Updated ${row.email}`, "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{row.email}</span>
          {row.stripeCustomerId && <Badge variant="muted">stripe</Badge>}
        </div>
        <span className="text-[12.5px] text-muted-2">{row.firstName}</span>
      </div>

      <div className="md:w-[130px]">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanTier)}
          className="h-9 w-full rounded-[var(--radius-sm)] border border-border bg-surface-3 px-2 text-[13px] text-foreground focus:border-[var(--accent-line)] focus:outline-none"
        >
          {PLAN_LIST.map((p) => (
            <option key={p.tier} value={p.tier}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 md:w-[150px]">
        <input
          type="number"
          min={0}
          value={usageCount}
          onChange={(e) =>
            setUsageCount(Math.max(0, Number(e.target.value) || 0))
          }
          className="h-9 w-16 rounded-[var(--radius-sm)] border border-border bg-surface-3 px-2 text-[13px] text-foreground focus:border-[var(--accent-line)] focus:outline-none"
        />
        <span className="font-mono text-[12px] text-muted-2">
          / {row.limit > 100000 ? "∞" : row.limit}
        </span>
      </div>

      <span className="text-sm text-muted md:w-[70px]">{row.projectCount}</span>

      <span className="font-mono text-[12.5px] text-muted md:w-[90px]">
        {formatDate(row.createdAt)}
      </span>

      <div className="md:w-[80px]">
        <Button
          size="sm"
          variant={dirty ? "primary" : "secondary"}
          disabled={!dirty || saving}
          loading={saving}
          onClick={save}
        >
          {!saving && <Check size={14} />} Save
        </Button>
      </div>
    </div>
  );
}
