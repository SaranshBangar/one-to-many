/**
 * Central environment + feature-flag resolution.
 *
 * Every external integration (auth, db, AI, payments, transcription) degrades to
 * a self-contained MOCK implementation when its credentials are absent. This lets
 * the whole app run end-to-end locally with zero accounts, then go live service by
 * service as you drop real keys into `.env.local`.
 *
 * Set MOCK_MODE=1 to force every service into mock regardless of keys.
 */

function has(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

const forceMock =
  process.env.MOCK_MODE === "1" || process.env.MOCK_MODE === "true";

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  forceMock,

  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceStarter: process.env.STRIPE_PRICE_STARTER,
    pricePro: process.env.STRIPE_PRICE_PRO,
    priceMax: process.env.STRIPE_PRICE_MAX,
  },

  whisper: {
    // Path/command to a local whisper CLI. Falls back to mock when unset/unavailable.
    bin: process.env.WHISPER_BIN,
    model: process.env.WHISPER_MODEL || "base",
  },

  // Emails granted access to /admin. Comma-separated. Matched case-insensitively
  // against the signed-in user's email. Defaults to the project owner.
  adminEmails: (process.env.ADMIN_EMAILS || "saranshbangad@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
} as const;

/** Per-service mock resolution. forceMock wins; otherwise mock when creds missing. */
export const mock = {
  auth: forceMock || !has(env.clerk.secretKey) || !has(env.clerk.publishableKey),
  db:
    forceMock ||
    !has(env.firebase.projectId) ||
    !has(env.firebase.clientEmail) ||
    !has(env.firebase.privateKey),
  ai: forceMock || !has(env.gemini.apiKey),
  payments: forceMock || !has(env.stripe.secretKey),
  transcription: forceMock || !has(env.whisper.bin),
} as const;

export type ServiceName = keyof typeof mock;

/** Human-readable status for the dev banner / health endpoint. */
export function serviceStatus() {
  return {
    auth: mock.auth ? "mock" : "live",
    db: mock.db ? "mock" : "live",
    ai: mock.ai ? "mock" : "live",
    payments: mock.payments ? "mock" : "live",
    transcription: mock.transcription ? "mock" : "live",
  } as const;
}

export const isClerkConfigured = !mock.auth;
