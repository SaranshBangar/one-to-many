import { Badge } from "@/components/ui/misc";
import type { ProjectStatus } from "@/lib/db/types";

const MAP: Record<
  ProjectStatus,
  { label: string; variant: "default" | "success" | "accent" | "muted" }
> = {
  queued: { label: "Queued", variant: "muted" },
  transcribing: { label: "Transcribing", variant: "accent" },
  extracting: { label: "Extracting", variant: "accent" },
  generating: { label: "Generating", variant: "accent" },
  ready: { label: "Ready", variant: "success" },
  failed: { label: "Failed", variant: "default" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
