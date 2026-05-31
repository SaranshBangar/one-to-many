import { env, mock } from "../env";
import type { Platform, Tone } from "../db/types";
import { PLATFORMS } from "../content";
import { FOUNDER_VOICE_SYSTEM, summarizePrompt, generatePrompt } from "./prompts";

async function callGemini(prompt: string, opts: { system?: string; temperature?: number } = {}): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey! });
  const res = await ai.models.generateContent({
    model: env.gemini.model,
    contents: prompt,
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.9,
    },
  });
  return (res.text ?? "").trim();
}

/** Pull a one-line summary out of a transcript. */
export async function summarize(transcript: string): Promise<string> {
  if (mock.ai) return mockSummary(transcript);
  return callGemini(summarizePrompt(transcript), {
    system: FOUNDER_VOICE_SYSTEM,
    temperature: 0.4,
  });
}

/** Generate one platform's content in the requested tone. */
export async function generate(args: { platform: Platform; tone: Tone; summary: string; transcript: string }): Promise<string> {
  if (mock.ai) return mockOutput(args.platform, args.tone, args.summary);
  return callGemini(generatePrompt(args), {
    system: FOUNDER_VOICE_SYSTEM,
    temperature: 0.9,
  });
}

// ---------------------------------------------------------------------------
// Mock generation, believable, platform-shaped output with no API key.
// ---------------------------------------------------------------------------

function firstSentence(text: string): string {
  const s = text.trim().split(/(?<=[.!?])\s/)[0] || text.trim();
  return s.replace(/\s+/g, " ").slice(0, 160);
}

function topic(summary: string): string {
  const s = firstSentence(summary).replace(/[.!?]+$/, "");
  return s || "what we learned building this";
}

function mockSummary(transcript: string): string {
  const head = firstSentence(transcript);
  return `Main idea: ${head}. The episode unpacks how this played out in practice and what a founder should take away.`;
}

function mockOutput(platform: Platform, tone: Tone, summary: string): string {
  const t = topic(summary);
  const sample = PLATFORMS[platform].label;
  const punch =
    tone === "direct"
      ? "No fluff. Here's the part that matters."
      : tone === "educational"
        ? "Here's the takeaway, step by step."
        : "Here's what actually happened.";

  switch (platform) {
    case "linkedin":
      return `${capitalize(t)}.\n\n${punch}\n\nMost advice here is generic. This isn't.\n\nWe learned it the hard way: the move that worked wasn't a tactic you read about, it was doing the unscalable thing consistently, every week, until it compounded.\n\nIf you're early and it feels slow, that's the point. Slow and specific beats fast and generic.\n\n(Mock output, add GEMINI_API_KEY to generate the real thing.)`;
    case "twitter":
      return `${capitalize(t)}.\n\nA short thread 🧵\n\n1/ ${punch}\n\n2/ The thing nobody tells you: the unscalable move is the moat. We did it every week.\n\n3/ Specific beats generic. Every time.\n\n4/ If it feels slow early on, you're probably doing it right.\n\n5/ That's the whole lesson. Full story on the episode.\n\n(Mock output, add GEMINI_API_KEY for the real thread.)`;
    case "email":
      return `Subject: ${capitalize(t)}\n\n${punch} In this week's episode we break down the one move that actually moved the needle, and why the slow, specific version beats the fast, generic one every time. Worth the 20 minutes.\n\n(Mock output, add GEMINI_API_KEY.)`;
    case "shorts":
      return `HOOK: ${capitalize(t)}, and almost everyone gets it backwards.\n\nINSIGHT: The move that worked wasn't a growth hack. It was doing the unscalable thing every single week until it compounded. Specific beats generic.\n\nCTA: Full breakdown on the podcast, link below.\n\n(Mock output, add GEMINI_API_KEY.)`;
    default:
      return `${sample}: ${t}`;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
