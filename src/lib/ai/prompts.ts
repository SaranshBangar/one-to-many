import type { Platform, Tone } from "../db/types";
import { TONES, PLATFORMS } from "../content";

/**
 * The product's whole pitch is "sounds like you, not generic AI". These prompts
 * are deliberately opinionated to suppress the usual LLM tells.
 */
export const FOUNDER_VOICE_SYSTEM = `You are a ghostwriter for an indie B2B SaaS founder who hosts a podcast. You repurpose their spoken episodes into written content that sounds exactly like THEM, not like a marketing agency or a generic AI.

Hard rules:
- Preserve the founder's actual phrasing, opinions, and specific stories from the transcript. Quote their real numbers and examples; never invent facts.
- Sound human and first-person. A peer founder should read it and think "yeah, that's how they talk."
- Ban these AI tells: "In today's fast-paced world", "Let's dive in", "game-changer", "unlock", "leverage" (as a verb), "supercharge", "elevate", "in conclusion", "the world of", em-dash overuse, and motivational-poster endings.
- No hashtags unless explicitly asked. No emoji unless the platform format calls for it.
- Never include meta commentary, labels, or notes, output ONLY the content the founder would paste.`;

export function summarizePrompt(transcript: string): string {
  return `Below is a transcript of a founder's podcast episode. Extract the core substance so it can be repurposed.

Return:
1. A one-sentence summary of the main idea.
2. 3–6 key points, each a concrete insight, story, or number actually present in the transcript (no invention).
3. The single most quotable line, verbatim.

Keep the founder's own framing and vocabulary.

TRANSCRIPT:
"""
${transcript.slice(0, 24_000)}
"""`;
}

const PLATFORM_SPEC: Record<Platform, string> = {
  linkedin: `Format: LinkedIn post, 1–3 short paragraphs (single-sentence lines are good for rhythm). Strong first line that stands alone as a hook. Conversational. End with a reflective takeaway, NOT a "what do you think?" bait question. No hashtags.`,
  twitter: `Format: Twitter/X thread of 5–7 tweets. Number them "1/", "2/"… The first tweet is a scroll-stopping hook that works alone. Each tweet ≤ 280 characters. One idea per tweet. Last tweet lands the takeaway. At most one emoji in the whole thread.`,
  email: `Format: Email teaser for a founder newsletter, 50–75 words total. Start with "Subject: " then a compelling subject line, a blank line, then the body. The body teases the episode's main insight and makes the reader want the full thing. Warm, direct.`,
  shorts: `Format: YouTube Shorts script for a 15–30 second talking-head clip. Three labeled beats on their own lines: "HOOK:" (a line that stops the scroll), "INSIGHT:" (the single best takeaway, spoken naturally), "CTA:" (a soft call to watch/listen to the full episode). Spoken cadence, not written prose.`,
};

export function generatePrompt(args: { platform: Platform; tone: Tone; summary: string; transcript: string }): string {
  const { platform, tone, summary, transcript } = args;
  return `Repurpose this founder's podcast episode into ${PLATFORMS[platform].label}.

TONE, ${TONES[tone].label}: ${TONES[tone].guidance}

${PLATFORM_SPEC[platform]}

EPISODE SUMMARY:
${summary}

SOURCE TRANSCRIPT (ground every claim in this, do not invent):
"""
${transcript.slice(0, 16_000)}
"""

Output only the ${PLATFORMS[platform].label}. No preamble, no labels except those required by the format above.`;
}
