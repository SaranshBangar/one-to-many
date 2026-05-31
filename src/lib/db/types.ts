export type PlanTier = "free" | "starter" | "pro" | "max";

export type Platform = "linkedin" | "twitter" | "email" | "shorts";

export type Tone = "authentic" | "educational" | "direct";

export type SourceType = "youtube" | "file" | "transcript";

export type ProjectStatus =
  | "queued"
  | "transcribing"
  | "extracting"
  | "generating"
  | "ready"
  | "failed";

/** Generated content for a single platform. */
export type Output = {
  platform: Platform;
  content: string;
  tone: Tone;
  updatedAt: string;
};

export type Project = {
  id: string;
  userId: string;
  title: string;
  sourceType: SourceType;
  /** YouTube URL, original filename, or "Pasted transcript". */
  sourceRef: string;
  status: ProjectStatus;
  tone: Tone;
  platforms: Platform[];
  transcript: string | null;
  summary: string | null;
  outputs: Output[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppUser = {
  id: string;
  email: string;
  firstName: string;
  plan: PlanTier;
  /** Billing-period usage, reset when usageMonth rolls over. */
  usageMonth: string; // YYYY-MM
  usageCount: number;
  defaultTone: Tone;
  stripeCustomerId: string | null;
  createdAt: string;
};
