import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  size = 26,
}: {
  href?: string | null;
  className?: string;
  size?: number;
}) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em]",
        className,
      )}
      style={{ fontSize: 17 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/app-icon.svg"
        alt="OneToMany"
        width={size}
        height={size}
        className="rounded-[7px]"
      />
      OneToMany
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}
