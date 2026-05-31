import { nanoid } from "../utils";
import { currentMonth } from "../plans";
import type { Db, CreateProjectInput } from "./index";
import type { AppUser, Project } from "./types";

type Store = {
  users: Map<string, AppUser>;
  projects: Map<string, Project>;
  seeded: boolean;
};

// Persist across Next.js hot reloads in dev (module re-eval) by hanging off global.
const g = globalThis as unknown as { __o2mStore?: Store };
const store: Store =
  g.__o2mStore ??
  (g.__o2mStore = { users: new Map(), projects: new Map(), seeded: false });

function now() {
  return new Date().toISOString();
}

function seed() {
  if (store.seeded) return;
  store.seeded = true;

  const user: AppUser = {
    id: "demo_user",
    email: "founder@example.com",
    firstName: "Demo",
    plan: "pro",
    usageMonth: currentMonth(),
    usageCount: 1,
    defaultTone: "authentic",
    stripeCustomerId: null,
    createdAt: now(),
  };
  store.users.set(user.id, user);

  const sample: Project = {
    id: "sample01",
    userId: user.id,
    title: "How we got our first 100 SaaS customers",
    sourceType: "youtube",
    sourceRef: "https://youtube.com/watch?v=demo",
    status: "ready",
    tone: "authentic",
    platforms: ["linkedin", "twitter", "email", "shorts"],
    transcript:
      "So when we launched, we had zero distribution. No audience, no list. The thing that actually worked was talking to ten users a week, every week, and shipping the exact thing they asked for...",
    summary:
      "Early traction came from relentless user conversations and shipping requested features fast, not from broad marketing.",
    outputs: [
      {
        platform: "linkedin",
        tone: "authentic",
        updatedAt: now(),
        content:
          "We got our first 100 customers with zero audience.\n\nNo list. No following. No ad budget.\n\nHere's what actually moved the needle:\n\nWe talked to 10 users every single week — and shipped the exact thing they asked for, fast.\n\nNot a roadmap. Not a survey. Real conversations, then code.\n\nThe lesson: distribution isn't a channel you find. It's trust you earn one founder-to-founder chat at a time.",
      },
      {
        platform: "twitter",
        tone: "authentic",
        updatedAt: now(),
        content:
          "We hit our first 100 customers with zero audience.\n\nHere's the playbook 🧵\n\n1/ No list, no following, no ads. Just one habit that compounded.\n\n2/ We talked to 10 users a week. Every week. No exceptions.\n\n3/ Then we shipped the exact thing they asked for — within days, not quarters.\n\n4/ Speed of response > size of roadmap.\n\n5/ Distribution wasn't a channel. It was trust, earned one chat at a time.",
      },
      {
        platform: "email",
        tone: "authentic",
        updatedAt: now(),
        content:
          "Subject: How we got 100 customers with no audience\n\nWe launched with zero distribution — no list, no following. What worked wasn't marketing. It was talking to 10 users a week and shipping what they asked for, fast. Full breakdown in this week's episode.",
      },
      {
        platform: "shorts",
        tone: "authentic",
        updatedAt: now(),
        content:
          "HOOK: We got 100 customers with zero audience.\n\nINSIGHT: We talked to 10 users every week and shipped exactly what they asked for — in days, not quarters. Distribution wasn't a channel, it was trust.\n\nCTA: Full story on the podcast — link below.",
      },
    ],
    error: null,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
  };
  store.projects.set(sample.id, sample);
}

export class MockDb implements Db {
  constructor() {
    seed();
  }

  async getUser(id: string) {
    return store.users.get(id) ?? null;
  }

  async ensureUser(s: { id: string; email: string; firstName: string }) {
    const existing = store.users.get(s.id);
    if (existing) return existing;
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
    store.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, patch: Partial<AppUser>) {
    const u = store.users.get(id);
    if (!u) throw new Error(`user ${id} not found`);
    const next = { ...u, ...patch };
    store.users.set(id, next);
    return next;
  }

  async listUsers() {
    return [...store.users.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createProject(input: CreateProjectInput) {
    const ts = now();
    const project: Project = {
      outputs: [],
      transcript: null,
      summary: null,
      error: null,
      status: "queued",
      ...input,
      id: nanoid(8),
      createdAt: ts,
      updatedAt: ts,
    };
    store.projects.set(project.id, project);
    return project;
  }

  async getProject(id: string) {
    return store.projects.get(id) ?? null;
  }

  async listProjects(userId: string) {
    return [...store.projects.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listAllProjects() {
    return [...store.projects.values()];
  }

  async updateProject(id: string, patch: Partial<Project>) {
    const p = store.projects.get(id);
    if (!p) throw new Error(`project ${id} not found`);
    const next = { ...p, ...patch, updatedAt: now() };
    store.projects.set(id, next);
    return next;
  }
}
