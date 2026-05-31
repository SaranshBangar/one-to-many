import { env } from "./env";
import { getSessionUser } from "./session";
import type { AppUser } from "./db/types";

/** True when the email is on the configured admin allowlist. */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.toLowerCase());
}

/**
 * Current user iff they're an admin — null otherwise. Use to gate admin pages
 * (redirect on null) and API routes (403 on null). Never trust the client.
 */
export async function getAdminUser(): Promise<AppUser | null> {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) return null;
  return user;
}
