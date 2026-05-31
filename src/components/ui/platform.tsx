import { Mail, Play } from "lucide-react";
import type { Platform } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const GLYPH: Record<
  Platform,
  { label?: string; icon?: "mail" | "play"; color: string }
> = {
  linkedin: { label: "in", color: "var(--p-linkedin)" },
  twitter: { label: "x", color: "var(--p-x)" },
  email: { icon: "mail", color: "var(--p-email)" },
  shorts: { icon: "play", color: "var(--p-shorts)" },
};

/** Generic monochrome platform mark (not a brand logo), per the design system. */
export function PlatformGlyph({
  id,
  size = 36,
}: {
  id: Platform;
  size?: number;
}) {
  const g = GLYPH[id];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] border border-border bg-surface-2 font-mono font-bold lowercase"
      style={{ width: size, height: size, color: g.color, fontSize: size * 0.42 }}
    >
      {g.icon === "mail" ? (
        <Mail size={size * 0.5} />
      ) : g.icon === "play" ? (
        <Play size={size * 0.5} fill="currentColor" strokeWidth={0} />
      ) : (
        g.label
      )}
    </span>
  );
}

/** Orange-gradient avatar with mono initials. */
export function Avatar({
  initials,
  size = 34,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a5c] to-[#ff6b35] font-mono font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}
