import { mock } from "../env";
import type { AppUser, Project } from "./types";

export type CreateProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "outputs" | "transcript" | "summary" | "error" | "status"
> &
  Partial<Pick<Project, "status" | "transcript" | "summary">>;

/** Storage contract implemented by both the in-memory mock and Firestore. */
export interface Db {
  getUser(id: string): Promise<AppUser | null>;
  /** Create-or-fetch a user from auth identity (used on every authed request). */
  ensureUser(seed: {
    id: string;
    email: string;
    firstName: string;
  }): Promise<AppUser>;
  updateUser(id: string, patch: Partial<AppUser>): Promise<AppUser>;
  /** All users, newest first. Admin-only surfaces. */
  listUsers(): Promise<AppUser[]>;

  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  listProjects(userId: string): Promise<Project[]>;
  /** Every project across all users. Admin-only surfaces. */
  listAllProjects(): Promise<Project[]>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
}

let _db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;
  if (mock.db) {
    const { MockDb } = await import("./mock");
    _db = new MockDb();
  } else {
    const { FirestoreDb } = await import("./firestore");
    _db = new FirestoreDb();
  }
  return _db;
}

export * from "./types";
