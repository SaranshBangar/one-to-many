import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { TONE_KEYS } from "@/lib/content";

const Body = z.object({
  defaultTone: z.enum(TONE_KEYS as [string, ...string[]]).optional(),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", detail: (e as Error).message },
      { status: 400 },
    );
  }
  const db = await getDb();
  const updated = await db.updateUser(user.id, {
    ...(body.defaultTone ? { defaultTone: body.defaultTone as never } : {}),
  });
  return NextResponse.json({ user: updated });
}
