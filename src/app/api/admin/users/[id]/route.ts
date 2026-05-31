import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { TONE_KEYS } from "@/lib/content";

const Body = z.object({
  plan: z.enum(["free", "starter", "pro", "max"]).optional(),
  usageCount: z.number().int().min(0).optional(),
  usageMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  defaultTone: z.enum(TONE_KEYS as [string, ...string[]]).optional(),
});

/** Admin-only: edit any user's plan / usage / profile. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

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
  const target = await db.getUser(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await db.updateUser(id, body as Partial<typeof target>);
  return NextResponse.json({ user: updated });
}
