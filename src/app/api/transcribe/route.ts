import { NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { getSessionUser } from "@/lib/session";
import { transcribeUpload } from "@/lib/transcription";

// Transcription can be slow (Gemini multimodal / local Whisper). Vercel Hobby
// clamps to 60s, Pro honors up to 300.
export const maxDuration = 300;

// Files up to this size are transcribed (inline under ~15MB, Files API above).
// Matches the cap in /api/blob-upload; bounds function memory when buffering.
const MAX_BYTES = 200 * 1024 * 1024;

const Body = z.object({
  // A Vercel Blob URL produced by the client upload. Bytes don't pass through
  // the request body (Vercel caps that at 4.5MB) — we fetch them here.
  url: z.string().url(),
  filename: z.string().trim().max(300).optional().default("audio"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Expected an uploaded file URL." }, { status: 400 });
  }

  // Only accept blobs from our own store, never arbitrary URLs (SSRF guard).
  if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(parsed.url)) {
    return NextResponse.json({ error: "Unrecognized upload URL." }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.url);
    if (!res.ok) {
      return NextResponse.json({ error: "Couldn't read the uploaded file." }, { status: 400 });
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is over the 200MB transcription limit. Paste a transcript instead." },
        { status: 413 },
      );
    }
    const mime = res.headers.get("content-type") || "audio/mpeg";
    const text = await transcribeUpload(bytes, mime, parsed.filename);
    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Couldn't get a usable transcript from that file. Try another, or paste a transcript." },
        { status: 422 },
      );
    }
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription failed." },
      { status: 500 },
    );
  } finally {
    // The blob is a transient staging file; remove it once transcribed.
    await del(parsed.url).catch(() => {});
  }
}
