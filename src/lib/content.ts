import type { Platform, Tone, ProjectStatus } from "./db/types";

export const TONES: Record<
  Tone,
  { label: string; description: string; guidance: string }
> = {
  authentic: {
    label: "Authentic",
    description: "Sounds like you — honest, personal, a little raw.",
    guidance:
      "Write like a founder talking to peers. First person. Specific, lived detail over generalities. Short punchy lines. No corporate hedging, no hype, no emoji spam. It should feel hand-written.",
  },
  educational: {
    label: "Educational",
    description: "Teach a clear takeaway, step by step.",
    guidance:
      "Lead with the lesson. Structure as clear, numbered or sequential insight. Define the 'why'. Confident but not preachy. Still in the founder's first-person voice.",
  },
  direct: {
    label: "Direct / No-BS",
    description: "Blunt, fast, zero filler.",
    guidance:
      "Strip every unnecessary word. Strong claim up front. Short declarative sentences. No qualifiers, no throat-clearing, no emoji. Make every line earn its place.",
  },
};

export const TONE_KEYS = Object.keys(TONES) as Tone[];

export const PLATFORMS: Record<
  Platform,
  { label: string; short: string; emoji: string; blurb: string }
> = {
  linkedin: {
    label: "LinkedIn post",
    short: "LinkedIn",
    emoji: "🔗",
    blurb: "Long-form posts with a hook, 3–5 tight paragraphs, and a question that earns replies.",
  },
  twitter: {
    label: "Twitter/X thread",
    short: "X / Twitter",
    emoji: "🧵",
    blurb: "Threads that open on your sharpest line and pace each beat for the scroll.",
  },
  email: {
    label: "Email teaser",
    short: "Email",
    emoji: "✉️",
    blurb: "A newsletter with a subject line worth opening and a body worth forwarding.",
  },
  shorts: {
    label: "YouTube Shorts script",
    short: "YouTube Shorts",
    emoji: "🎬",
    blurb: "30–45s scripts with timed hooks, beats and a payoff your editor can shoot.",
  },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS) as Platform[];

export const STATUS_STEPS: { status: ProjectStatus; label: string }[] = [
  { status: "transcribing", label: "Transcribing audio" },
  { status: "extracting", label: "Extracting key points" },
  { status: "generating", label: "Generating posts" },
  { status: "ready", label: "Ready" },
];

export function statusIndex(status: ProjectStatus): number {
  if (status === "queued") return 0;
  if (status === "failed") return -1;
  const i = STATUS_STEPS.findIndex((s) => s.status === status);
  return i;
}
