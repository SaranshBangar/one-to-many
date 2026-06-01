import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env, mock } from "../env";
import { transcribeAudio } from "../ai/gemini";
import type { SourceType } from "../db/types";

const MOCK_TRANSCRIPT = `Welcome back to the show. Today I want to talk about how we actually got our first hundred customers, because when we launched we had nothing, no audience, no email list, no following.

The thing that worked wasn't some growth hack. It was talking to ten users every single week, every week without fail, and then shipping the exact thing they asked for. Not a survey, not a roadmap, real conversations, then code, within days.

People always ask what channel we used. There was no channel. Distribution wasn't something we found, it was trust we earned one founder-to-founder conversation at a time. The unscalable thing was the moat.

So if you're early and it feels slow, that's actually the signal you're doing it right. Slow and specific beats fast and generic, every time.`;

export type TranscribeInput = {
  sourceType: SourceType;
  /** YouTube URL, local file path, or ignored for pasted transcript. */
  sourceRef: string;
  /** Raw text when sourceType === "transcript". */
  pastedText?: string;
};

/** Resolve a source down to plain transcript text. */
export async function transcribeSource(input: TranscribeInput): Promise<string> {
  // Pasted text is already a transcript, no STT needed, works even in live mode.
  if (input.sourceType === "transcript") {
    return (input.pastedText ?? "").trim();
  }

  if (mock.transcription) {
    return MOCK_TRANSCRIPT;
  }

  if (input.sourceType === "youtube") {
    const audio = await youtubeToAudio(input.sourceRef);
    try {
      return await runWhisper(audio.path);
    } finally {
      await audio.cleanup();
    }
  }

  // sourceType === "file": sourceRef is a local path to the uploaded media.
  return runWhisper(input.sourceRef);
}

/**
 * Transcribe an uploaded audio/video file. Decision order (mock-first):
 *   1. Local Whisper CLI when WHISPER_BIN is set (dev machines).
 *   2. Gemini multimodal when AI is live but Whisper isn't (serverless).
 *   3. Canned mock transcript when nothing is configured.
 */
export async function transcribeUpload(
  bytes: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  // 1. Local Whisper (needs ffmpeg + WHISPER_BIN on PATH).
  if (!mock.transcription) {
    const dir = await mkdtemp(join(tmpdir(), "o2m-up-"));
    const ext = filename.match(/\.[^.]+$/)?.[0] ?? ".m4a";
    const path = join(dir, `audio${ext}`);
    try {
      await writeFile(path, bytes);
      return await runWhisper(path);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  // 2. Gemini handles the audio directly, no binaries required.
  if (!mock.ai) {
    return transcribeAudio(bytes, mimeType);
  }

  // 3. Fully mocked.
  return MOCK_TRANSCRIPT;
}

/** Download a YouTube URL's audio track using yt-dlp (must be on PATH). */
async function youtubeToAudio(url: string) {
  const dir = await mkdtemp(join(tmpdir(), "o2m-"));
  const out = join(dir, "audio.m4a");
  await exec("yt-dlp", ["-f", "bestaudio", "-o", out, url]);
  return {
    path: out,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

/** Run the local Whisper CLI and read back the transcript text. */
async function runWhisper(audioPath: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "o2m-whisper-"));
  try {
    await exec(env.whisper.bin!, [audioPath, "--model", env.whisper.model, "--output_format", "txt", "--output_dir", dir, "--fp16", "False"]);
    // whisper writes <basename>.txt into output_dir
    const base = audioPath
      .split(/[\\/]/)
      .pop()!
      .replace(/\.[^.]+$/, "");
    let txt: string;
    try {
      txt = await readFile(join(dir, `${base}.txt`), "utf8");
    } catch (e) {
      // Whisper exits 0 even when it can't decode the audio (e.g. ffmpeg not on
      // PATH), it just skips the file and writes nothing. Surface that clearly
      // instead of leaking a cryptic ENOENT on the missing output file.
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          "Whisper produced no transcript, ensure ffmpeg is installed and on PATH (it is required to decode audio). On serverless hosts, leave WHISPER_BIN unset and use a hosted STT or pasted transcripts.",
        );
      }
      throw e;
    }
    return txt.trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function exec(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", (e) => {
      // ENOENT = the binary isn't on PATH. Common on serverless hosts (Vercel),
      // which have no yt-dlp / ffmpeg / whisper. Translate the cryptic
      // "spawn <cmd> ENOENT" into a clear, user-facing explanation.
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `Audio/video transcription isn't available on this deployment ("${cmd}" is not installed). Paste a transcript instead, or wire a hosted speech-to-text API in src/lib/transcription/index.ts.`,
          ),
        );
        return;
      }
      reject(e);
    });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))));
  });
}
