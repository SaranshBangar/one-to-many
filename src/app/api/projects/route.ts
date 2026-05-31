import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { canCreate, consumePiece } from "@/lib/usage";
import { runProject } from "@/lib/jobs/processor";
import { PLANS } from "@/lib/plans";
import { PLATFORM_KEYS, TONE_KEYS } from "@/lib/content";

// Generation (transcribe -> summarize -> N platform calls) runs in the
// background via `after`. On serverless this extends the invocation via
// waitUntil up to maxDuration, so the work isn't frozen when the response
// returns. Platform caps: Vercel Hobby clamps to 60s, Pro honors up to 300.
export const maxDuration = 300;

const Body = z.object({
  sourceType: z.enum(["youtube", "file", "transcript"]),
  sourceRef: z.string().trim().max(2000).optional().default(""),
  transcript: z.string().trim().max(200_000).optional(),
  title: z.string().trim().max(200).optional(),
  tone: z.enum(TONE_KEYS as [string, ...string[]]).default("authentic"),
  platforms: z
    .array(z.enum(PLATFORM_KEYS as [string, ...string[]]))
    .min(1)
    .max(4),
});

function deriveTitle(input: z.infer<typeof Body>): string {
  if (input.title) return input.title;
  if (input.sourceType === "transcript" && input.transcript) {
    return input.transcript.split(/\s+/).slice(0, 8).join(" ") + "…";
  }
  if (input.sourceType === "youtube") return "YouTube episode";
  return input.sourceRef || "Untitled piece";
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", detail: (e as Error).message },
      { status: 400 },
    );
  }

  // Validate source completeness.
  if (parsed.sourceType === "transcript" && (parsed.transcript ?? "").length < 20) {
    return NextResponse.json(
      { error: "Paste at least a few sentences of transcript." },
      { status: 400 },
    );
  }
  if (parsed.sourceType === "youtube" && !parsed.sourceRef) {
    return NextResponse.json({ error: "YouTube URL required." }, { status: 400 });
  }

  // Enforce plan limits.
  const limit = canCreate(user);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've used all ${limit.limit} pieces on your ${PLANS[user.plan].name} plan this month.`,
        code: "limit_reached",
      },
      { status: 402 },
    );
  }
  const maxPlatforms = PLANS[user.plan].maxPlatforms;
  if (parsed.platforms.length > maxPlatforms) {
    return NextResponse.json(
      {
        error: `Your plan allows up to ${maxPlatforms} platforms per piece.`,
        code: "platform_limit",
      },
      { status: 402 },
    );
  }

  const db = await getDb();
  const project = await db.createProject({
    userId: user.id,
    title: deriveTitle(parsed),
    sourceType: parsed.sourceType,
    sourceRef:
      parsed.sourceType === "transcript" ? "Pasted transcript" : parsed.sourceRef,
    tone: parsed.tone as never,
    platforms: parsed.platforms as never,
    // Stash pasted text as the initial transcript so the processor can skip STT.
    transcript: parsed.sourceType === "transcript" ? parsed.transcript! : null,
    status: "queued",
  });

  await consumePiece(user);

  // Background processing; the client polls GET /api/projects/[id].
  // `after` keeps the serverless instance alive until runProject settles,
  // instead of the response freezing it mid-job.
  after(() => runProject(project.id));

  return NextResponse.json({ id: project.id }, { status: 201 });
}
