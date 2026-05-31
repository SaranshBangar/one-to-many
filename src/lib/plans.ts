import type { Platform, PlanTier } from "./db/types";

export const ALL_PLATFORMS: Platform[] = ["linkedin", "twitter", "email", "shorts"];

export type PlanDef = {
  tier: PlanTier;
  name: string;
  /** Monthly price in INR (₹). Free tier is 0. */
  priceMonthly: number;
  /** Stripe price id env key, resolved in lib/stripe. Absent for the free tier. */
  priceEnv?: "priceStarter" | "pricePro" | "priceMax";
  /** Repurpose jobs allowed per billing month. */
  piecesPerMonth: number;
  /** Max platforms selectable per job. */
  maxPlatforms: number;
  /** Tone selector unlocked. */
  toneSelector: boolean;
  customTones: boolean;
  prioritySupport: boolean;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Record<PlanTier, PlanDef> = {
  free: {
    tier: "free",
    name: "Free",
    priceMonthly: 0,
    piecesPerMonth: 5,
    maxPlatforms: 2,
    toneSelector: false,
    customTones: false,
    prioritySupport: false,
    blurb: "Try it on a real episode.",
    features: ["5 pieces / month", "2 platforms per piece", "Authentic tone", "Copy & download"],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    priceMonthly: 99,
    priceEnv: "priceStarter",
    piecesPerMonth: 10,
    maxPlatforms: 3,
    toneSelector: false,
    customTones: false,
    prioritySupport: false,
    blurb: "Kick the tires on real episodes.",
    features: ["10 pieces / month", "3 outputs per piece", "Basic platforms", "Copy & download"],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceMonthly: 249,
    priceEnv: "pricePro",
    piecesPerMonth: 20,
    maxPlatforms: 4,
    toneSelector: true,
    customTones: false,
    prioritySupport: false,
    blurb: "For founders publishing every week.",
    features: ["20 pieces / month", "All 4 platforms", "Tone selector", "Inline editing & regenerate"],
    highlight: true,
  },
  max: {
    tier: "max",
    name: "Max",
    priceMonthly: 499,
    priceEnv: "priceMax",
    piecesPerMonth: 1_000_000,
    maxPlatforms: 4,
    toneSelector: true,
    customTones: true,
    prioritySupport: true,
    blurb: "Teams and high-volume operators.",
    features: ["Unlimited pieces", "Custom tones", "Priority support", "Everything in Pro"],
  },
};

export const PLAN_LIST: PlanDef[] = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.max];

/** 20% annual discount, billed yearly. */
export function annualPrice(monthly: number) {
  return Math.round(monthly * 12 * 0.8);
}

export function currentMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
