import { mock } from "./env";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  imageUrl: string | null;
};

export const DEMO_USER: AuthUser = {
  id: "demo_user",
  email: "founder@example.com",
  firstName: "Demo",
  imageUrl: null,
};

/**
 * Resolve the current user on the server, in both mock and live (Clerk) modes.
 * Returns null when unauthenticated under live auth.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (mock.auth) return DEMO_USER;

  const { currentUser } = await import("@clerk/nextjs/server");
  const u = await currentUser();
  if (!u) return null;

  return {
    id: u.id,
    email: u.primaryEmailAddress?.emailAddress ?? "",
    firstName: u.firstName ?? "there",
    imageUrl: u.imageUrl ?? null,
  };
}

/** Require a user or throw — for API routes. */
export async function requireUser(): Promise<AuthUser> {
  const u = await getAuthUser();
  if (!u) throw new UnauthorizedError();
  return u;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
