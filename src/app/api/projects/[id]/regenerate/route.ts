import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { regenerateOutput } from "@/lib/jobs/processor";
import { PLATFORM_KEYS, TONE_KEYS } from "@/lib/content";
import { PLANS } from "@/lib/plans";

// Awaits a Gemini generation inline, allow more than the default function
// timeout. Vercel Hobby clamps to 60s, Pro honors up to 300.
export const maxDuration = 60;

const Body = z.object({
  platform: z.enum(PLATFORM_KEYS as [string, ...string[]]),
  tone: z.enum(TONE_KEYS as [string, ...string[]]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const db = await getDb();
  const project = await db.getProject(id);
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", detail: (e as Error).message }, { status: 400 });
  }

  // Tone switching is a paid capability.
  if (body.tone !== project.tone && !PLANS[user.plan].toneSelector) {
    return NextResponse.json({ error: "Upgrade to Pro to regenerate with a different tone." }, { status: 402 });
  }

  const output = await regenerateOutput(id, body.platform as never, body.tone as never);
  return NextResponse.json({ output });
}
