import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { mock } from "@/lib/env";
import type { PlanTier } from "@/lib/db/types";

/**
 * Simulated checkout completion (mock payments only). Upgrades the current user's
 * plan with no charge, then bounces to settings — mirrors the real Stripe
 * success_url redirect so the rest of the app is identical in both modes.
 */
export async function GET(req: Request) {
  if (!mock.payments) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }
  const user = await getSessionUser();
  const tier = new URL(req.url).searchParams.get("tier") as PlanTier | null;
  if (user && tier && ["free", "starter", "pro", "max"].includes(tier)) {
    const db = await getDb();
    await db.updateUser(user.id, { plan: tier });
  }
  return NextResponse.redirect(
    new URL(`/settings?upgraded=${tier ?? ""}`, req.url),
  );
}
