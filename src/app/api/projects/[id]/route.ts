import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { PLATFORM_KEYS } from "@/lib/content";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  return NextResponse.json({ project });
}

const PatchBody = z.object({
  platform: z.enum(PLATFORM_KEYS as [string, ...string[]]),
  content: z.string().max(50_000),
});

/** Save a hand-edited output for one platform. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    body = PatchBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", detail: (e as Error).message },
      { status: 400 },
    );
  }

  const outputs = project.outputs.map((o) =>
    o.platform === body.platform
      ? { ...o, content: body.content, updatedAt: new Date().toISOString() }
      : o,
  );
  const updated = await db.updateProject(id, { outputs });
  return NextResponse.json({ project: updated });
}
