import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "../env";
import { nanoid } from "../utils";
import { currentMonth } from "../plans";
import type { Db, CreateProjectInput } from "./index";
import type { AppUser, Project } from "./types";

function app(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({
    credential: cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      // Support both raw and \n-escaped private keys.
      privateKey: env.firebase.privateKey?.replace(/\\n/g, "\n"),
    }),
  });
}

function now() {
  return new Date().toISOString();
}

export class FirestoreDb implements Db {
  private fs: Firestore;
  constructor() {
    this.fs = getFirestore(app());
  }

  private users() {
    return this.fs.collection("users");
  }
  private projects() {
    return this.fs.collection("projects");
  }

  async getUser(id: string) {
    const doc = await this.users().doc(id).get();
    return doc.exists ? (doc.data() as AppUser) : null;
  }

  async ensureUser(s: { id: string; email: string; firstName: string }) {
    const ref = this.users().doc(s.id);
    const doc = await ref.get();
    if (doc.exists) return doc.data() as AppUser;
    const user: AppUser = {
      id: s.id,
      email: s.email,
      firstName: s.firstName,
      plan: "free",
      usageMonth: currentMonth(),
      usageCount: 0,
      defaultTone: "authentic",
      stripeCustomerId: null,
      createdAt: now(),
    };
    await ref.set(user);
    return user;
  }

  async updateUser(id: string, patch: Partial<AppUser>) {
    const ref = this.users().doc(id);
    await ref.set(patch, { merge: true });
    return (await ref.get()).data() as AppUser;
  }

  async listUsers() {
    const snap = await this.users().get();
    return snap.docs
      .map((d) => d.data() as AppUser)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createProject(input: CreateProjectInput) {
    const ts = now();
    const id = nanoid(8);
    const project: Project = {
      outputs: [],
      transcript: null,
      summary: null,
      error: null,
      status: "queued",
      ...input,
      id,
      createdAt: ts,
      updatedAt: ts,
    };
    await this.projects().doc(id).set(project);
    return project;
  }

  async getProject(id: string) {
    const doc = await this.projects().doc(id).get();
    return doc.exists ? (doc.data() as Project) : null;
  }

  async listProjects(userId: string) {
    // Sort in-memory rather than .orderBy() so this needs no composite index.
    const snap = await this.projects().where("userId", "==", userId).get();
    return snap.docs
      .map((d) => d.data() as Project)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listAllProjects() {
    const snap = await this.projects().get();
    return snap.docs.map((d) => d.data() as Project);
  }

  async updateProject(id: string, patch: Partial<Project>) {
    const ref = this.projects().doc(id);
    await ref.set({ ...patch, updatedAt: now() }, { merge: true });
    return (await ref.get()).data() as Project;
  }
}
