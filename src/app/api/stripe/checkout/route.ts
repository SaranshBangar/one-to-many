import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { createCheckout } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";

const Body = z.object({
  tier: z.enum(["free", "starter", "pro", "max"]),
  interval: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", detail: (e as Error).message }, { status: 400 });
  }

  // Free tier carries no charge, switch the plan directly, skip Stripe.
  if (body.tier === "free") {
    const db = await getDb();
    await db.updateUser(user.id, { plan: "free" });
    return NextResponse.json({ url: `${env.appUrl}/settings?upgraded=free` });
  }

  const url = await createCheckout({
    userId: user.id,
    email: user.email,
    tier: body.tier,
    interval: body.interval,
  });
  return NextResponse.json({ url });
}
