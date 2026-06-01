import { env, mock } from "../env";
import type { Platform, Tone } from "../db/types";
import { PLATFORMS } from "../content";
import { FOUNDER_VOICE_SYSTEM, summarizePrompt, generatePrompt } from "./prompts";

/**
 * Retry transient Gemini failures with exponential backoff. Google returns 503
 * UNAVAILABLE ("high demand") and 429 RESOURCE_EXHAUSTED under load; both clear
 * on their own. Non-transient errors (bad key, 400) throw immediately.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const transient =
        /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)\b/i.test(msg);
      if (!transient || i === attempts - 1) throw e;
      // 1s, 2s, 4s + jitter.
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i + Math.random() * 250));
    }
  }
  throw lastErr;
}

async function callGemini(prompt: string, opts: { system?: string; temperature?: number } = {}): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey! });
  const res = await withRetry(() =>
    ai.models.generateContent({
      model: env.gemini.model,
      contents: prompt,
      config: {
        systemInstruction: opts.system,
        temperature: opts.temperature ?? 0.9,
      },
    }),
  );
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

// Inline multimodal data must fit in the ~20MB request body once base64-encoded
// (which inflates bytes by ~33%). Above this raw size we stage via the Files API.
const INLINE_MAX_BYTES = 15 * 1024 * 1024;

const TRANSCRIBE_PROMPT =
  "Transcribe this recording to plain text. Output only the spoken words as a clean transcript, with no timestamps, speaker labels, or commentary.";

/**
 * Transcribe an uploaded audio/video file via Gemini's multimodal input.
 * Small files go inline in a single request; large files are staged through
 * the Files API (upload → poll until ACTIVE → reference by URI), which lifts
 * the cap to Gemini's 2GB / 48h file limit.
 */
export async function transcribeAudio(bytes: Buffer, mimeType: string): Promise<string> {
  const { GoogleGenAI, createPartFromUri, createUserContent, FileState } = await import(
    "@google/genai"
  );
  const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey! });
  const mime = mimeType || "audio/mpeg";

  // Small files: inline base64, one round-trip.
  if (bytes.byteLength <= INLINE_MAX_BYTES) {
    const res = await withRetry(() =>
      ai.models.generateContent({
        model: env.gemini.model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: mime, data: bytes.toString("base64") } },
              { text: TRANSCRIBE_PROMPT },
            ],
          },
        ],
        config: { temperature: 0 },
      }),
    );
    return (res.text ?? "").trim();
  }

  // Large files: stage through the Files API, then reference by URI.
  const uploaded = await ai.files.upload({
    file: new Blob([new Uint8Array(bytes)], { type: mime }),
    config: { mimeType: mime },
  });
  try {
    // Files land in PROCESSING; wait for ACTIVE before generating.
    let file = uploaded;
    const startedAt = Date.now();
    while (file.state === FileState.PROCESSING) {
      if (Date.now() - startedAt > 120_000) {
        throw new Error("Transcription timed out while Gemini processed the file.");
      }
      await new Promise((r) => setTimeout(r, 2000));
      file = await ai.files.get({ name: file.name! });
    }
    if (file.state === FileState.FAILED || !file.uri) {
      throw new Error("Gemini could not process this file.");
    }
    // Capture into consts so narrowing survives inside the retry closure.
    const uri = file.uri;
    const fileMime = file.mimeType ?? mime;
    const res = await withRetry(() =>
      ai.models.generateContent({
        model: env.gemini.model,
        contents: createUserContent([
          createPartFromUri(uri, fileMime),
          TRANSCRIBE_PROMPT,
        ]),
        config: { temperature: 0 },
      }),
    );
    return (res.text ?? "").trim();
  } finally {
    // Don't leave staged files lingering against the account quota.
    if (uploaded.name) {
      await ai.files.delete({ name: uploaded.name }).catch(() => {});
    }
  }
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
