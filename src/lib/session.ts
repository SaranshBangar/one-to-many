import { getAuthUser } from "./auth";
import { getDb } from "./db";
import type { AppUser } from "./db/types";

/**
 * The app-level user for the current request: resolves auth identity, then
 * creates-or-fetches the persisted AppUser record. Null when not signed in.
 */
export async function getSessionUser(): Promise<AppUser | null> {
  const auth = await getAuthUser();
  if (!auth) return null;
  const db = await getDb();
  return db.ensureUser({
    id: auth.id,
    email: auth.email,
    firstName: auth.firstName || "there",
  });
}

export async function requireSessionUser(): Promise<AppUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}
