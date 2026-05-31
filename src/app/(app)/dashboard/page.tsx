import Link from "next/link";
import { Plus, FileText, Play, Upload, Link2 } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { effectiveUsage } from "@/lib/usage";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, ProgressBar } from "@/components/ui/misc";
import { PlatformGlyph, Eyebrow } from "@/components/ui/platform";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

const QUICK = [
  { icon: Play, label: "YouTube URL" },
  { icon: Upload, label: "Upload file" },
  { icon: Link2, label: "Paste link" },
];

export default async function DashboardPage() {
  const user = (await getSessionUser())!;
  const db = await getDb();
  const projects = await db.listProjects(user.id);
  const usage = effectiveUsage(user);
  const plan = PLANS[user.plan];
  const unlimited = usage.limit > 100000;
  const pct = unlimited ? 0 : Math.min(100, (usage.used / usage.limit) * 100);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* greeting */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>{today}</Eyebrow>
          <h1 className="display text-3xl">Welcome back, {user.firstName}</h1>
        </div>
        <Link href="/upload">
          <Button size="lg">
            <Plus size={16} /> Upload new content
          </Button>
        </Link>
      </div>

      {/* usage + quick start */}
      <div className="grid gap-5 md:grid-cols-[1.1fr_1.4fr]">
        <Card className="flex flex-col gap-[18px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
              This month
            </span>
            <Badge variant="accent">{plan.name}</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="display text-[40px]">{usage.used}</span>
            <span className="text-base text-muted">
              {unlimited ? "uploads used" : `of ${usage.limit} uploads used`}
            </span>
          </div>
          {!unlimited && <ProgressBar value={pct} />}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11.5px] text-muted-2">
              Resets next month
            </span>
            {user.plan !== "max" && (
              <Link
                href="/settings?tab=billing"
                className="text-[13px] font-semibold text-accent"
              >
                Upgrade for unlimited →
              </Link>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-[18px]">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
            Start a new repurpose
          </span>
          <div className="grid grid-cols-3 gap-3">
            {QUICK.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href="/upload"
                className="flex flex-col items-start gap-3 rounded-[10px] border border-border bg-surface-2 p-[18px] transition-colors hover:border-border-2"
              >
                <Icon size={22} className="text-accent" />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>
          <span className="text-[12.5px] text-muted-2">
            Most founders paste a YouTube link — we pull the audio automatically.
          </span>
        </Card>
      </div>

      {/* recent projects */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-[18px]">
          <span className="font-semibold">Recent projects</span>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <FileText size={28} className="text-muted-2" />
            <p className="text-muted">Start by uploading your first piece.</p>
            <Link href="/upload">
              <Button>
                <Plus size={16} /> Upload content
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-4 border-b border-border px-6 py-3 font-mono text-[11px] tracking-[0.08em] text-muted-2">
              <span className="flex-1">TITLE</span>
              <span className="hidden w-[90px] sm:block">DATE</span>
              <span className="hidden w-[120px] sm:block">CHANNELS</span>
              <span className="w-[110px]">STATUS</span>
            </div>
            <div className="divide-y divide-border">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-2"
                >
                  <span className="flex-1 truncate text-sm font-medium">
                    {p.title}
                  </span>
                  <span className="hidden w-[90px] font-mono text-[12.5px] text-muted sm:block">
                    {formatDate(p.createdAt)}
                  </span>
                  <span className="hidden w-[120px] items-center gap-1.5 sm:flex">
                    {p.platforms.map((pl) => (
                      <PlatformGlyph key={pl} id={pl} size={24} />
                    ))}
                  </span>
                  <span className="w-[110px]">
                    <StatusBadge status={p.status} />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
