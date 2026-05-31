import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/misc";
import { PlatformGlyph, Avatar, Eyebrow } from "@/components/ui/platform";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { PLATFORMS, PLATFORM_KEYS } from "@/lib/content";
import { getSessionUser } from "@/lib/session";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const TESTIMONIALS = [
  {
    quote:
      "Finally sounds like me, not a marketing intern. I went from 1 post a week to a full content stack in minutes.",
    name: "Maya R.",
    role: "Founder, DevTooling SaaS",
  },
  {
    quote:
      "I record the podcast, paste the transcript, and ship to LinkedIn + X before my coffee's cold.",
    name: "Jonas K.",
    role: "Solo founder, FinOps app",
  },
  {
    quote:
      "The voice preservation is the whole thing. Repurpose.io gave me generic mush. This gives me my own takes.",
    name: "Priya S.",
    role: "Founder, B2B analytics",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();
  const signedIn = !!user;

  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="#pricing" className="hidden px-3 text-sm text-muted hover:text-foreground sm:block">
              Pricing
            </Link>
            <ThemeToggle />
            {signedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Try free</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center md:py-28">
        <Badge>
          <Dot className="text-accent" />
          Built by an indie founder, for indie founders
        </Badge>
        <h1 className="display mx-auto mt-6 max-w-3xl text-5xl md:text-[64px]">
          Turn your podcast into{" "}
          <span className="text-accent">10 posts</span> in 2 minutes
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted md:text-[19px]">
          Built for founders. Preserves your voice. No generic fluff — upload
          once, copy-paste everywhere.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={signedIn ? "/upload" : "/sign-up"}>
            <Button size="lg">
              {signedIn ? "Upload content" : "Try free for 7 days"}
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="#pricing">
            <Button variant="secondary" size="lg">
              <Play size={15} fill="currentColor" strokeWidth={0} />
              Watch 45s demo
            </Button>
          </Link>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-2">
          No card required · cancel anytime
        </p>

        {/* Demo placeholder — striped well with play affordance */}
        <div
          className="relative mt-14 h-[340px] w-full max-w-4xl overflow-hidden rounded-2xl border border-border md:h-[460px]"
          style={{
            background:
              "repeating-linear-gradient(135deg, #1a1a1a 0 14px, #161616 14px 28px)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-white">
              <Play size={28} fill="currentColor" strokeWidth={0} />
            </span>
            <span className="font-mono text-xs tracking-[0.1em] text-muted-2">
              [ 45-SEC DEMO · UPLOAD → OUTPUTS → COPY ]
            </span>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-center font-mono text-[13px] text-muted-2">
            Used by 100+ founders shipping content every week
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col justify-between gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-6"
              >
                <blockquote className="text-[15.5px] leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar initials={initials(t.name)} size={38} />
                  <span className="text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-2">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <Eyebrow>One upload · four channels</Eyebrow>
          <h2 className="display text-[38px]">Every format, in your voice</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_KEYS.map((p) => (
            <div
              key={p}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6"
            >
              <PlatformGlyph id={p} size={42} />
              <div className="flex flex-col gap-1.5">
                <h3 className="font-semibold">{PLATFORMS[p].short}</h3>
                <p className="text-[13.5px] leading-relaxed text-muted">
                  {PLATFORMS[p].blurb}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="display text-[38px]">Priced for one person</h2>
            <p className="text-muted">7-day free trial. No card. Cancel anytime.</p>
          </div>
          <div className="mt-10">
            <PricingCards signedIn={signedIn} currentTier={user?.plan} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row">
          <Logo />
          <div className="flex items-center gap-5">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Twitter</Link>
          </div>
          <p className="font-mono text-xs text-muted-2">
            Made by an indie founder.
          </p>
        </div>
      </footer>
    </div>
  );
}
