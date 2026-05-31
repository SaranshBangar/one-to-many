import { getDb } from "../db";
import type { Output } from "../db/types";
import { mock } from "../env";
import { transcribeSource } from "../transcription";
import { summarize, generate } from "../ai/gemini";

const g = globalThis as unknown as { __o2mRunning?: Set<string> };
const running = (g.__o2mRunning ??= new Set<string>());

/** Brief pauses in mock mode so the processing UI visibly steps through stages. */
function tick(ms: number) {
  return mock.ai ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

/**
 * Run a project end-to-end: transcribe -> summarize -> generate each platform.
 * Fire-and-forget from the API; persists status at every stage so the client
 * can poll. Safe to call once per project (guarded against double-run).
 */
export async function runProject(projectId: string): Promise<void> {
  if (running.has(projectId)) return;
  running.add(projectId);

  const db = await getDb();
  try {
    const project = await db.getProject(projectId);
    if (!project) return;

    // 1. Transcribe (pasted transcript skips STT).
    await db.updateProject(projectId, { status: "transcribing" });
    await tick(800);
    const transcript =
      project.sourceType === "transcript" && project.transcript
        ? project.transcript
        : await transcribeSource({
            sourceType: project.sourceType,
            sourceRef: project.sourceRef,
            pastedText: project.transcript ?? undefined,
          });

    if (!transcript || transcript.trim().length < 20) {
      throw new Error("Could not get usable transcript from this source.");
    }

    // 2. Summarize / extract key points.
    await db.updateProject(projectId, { transcript, status: "extracting" });
    await tick(800);
    const summary = await summarize(transcript);

    // 3. Generate every requested platform.
    await db.updateProject(projectId, { summary, status: "generating" });
    await tick(600);
    const outputs: Output[] = [];
    for (const platform of project.platforms) {
      const content = await generate({
        platform,
        tone: project.tone,
        summary,
        transcript,
      });
      outputs.push({
        platform,
        content,
        tone: project.tone,
        updatedAt: new Date().toISOString(),
      });
      await db.updateProject(projectId, { outputs: [...outputs] });
      await tick(400);
    }

    await db.updateProject(projectId, { status: "ready" });
  } catch (e) {
    await db.updateProject(projectId, {
      status: "failed",
      error: e instanceof Error ? e.message : "Processing failed.",
    });
  } finally {
    running.delete(projectId);
  }
}

/** Re-run a single platform's generation (used by the Regenerate button). */
export async function regenerateOutput(
  projectId: string,
  platform: Output["platform"],
  tone: Output["tone"],
): Promise<Output> {
  const db = await getDb();
  const project = await db.getProject(projectId);
  if (!project) throw new Error("Project not found");
  if (!project.transcript || !project.summary) {
    throw new Error("Project not processed yet");
  }
  const content = await generate({
    platform,
    tone,
    summary: project.summary,
    transcript: project.transcript,
  });
  const output: Output = {
    platform,
    content,
    tone,
    updatedAt: new Date().toISOString(),
  };
  const outputs = project.outputs.some((o) => o.platform === platform)
    ? project.outputs.map((o) => (o.platform === platform ? output : o))
    : [...project.outputs, output];
  await db.updateProject(projectId, { outputs });
  return output;
}
