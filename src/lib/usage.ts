import { getDb } from "./db";
import type { AppUser } from "./db/types";
import { PLANS, currentMonth } from "./plans";

/** Normalize a user's usage window to the current month (lazy reset). */
export function effectiveUsage(user: AppUser) {
  const month = currentMonth();
  const used = user.usageMonth === month ? user.usageCount : 0;
  const limit = PLANS[user.plan].piecesPerMonth;
  return { month, used, limit, remaining: Math.max(0, limit - used) };
}

export function canCreate(user: AppUser) {
  const { used, limit } = effectiveUsage(user);
  return { ok: used < limit, used, limit };
}

/** Record one consumed piece, resetting the counter on month rollover. */
export async function consumePiece(user: AppUser): Promise<AppUser> {
  const db = await getDb();
  const month = currentMonth();
  const base = user.usageMonth === month ? user.usageCount : 0;
  return db.updateUser(user.id, {
    usageMonth: month,
    usageCount: base + 1,
  });
}
