import { env, mock } from "./env";
import { PLANS } from "./plans";
import type { PlanTier } from "./db/types";

export type CheckoutArgs = {
  userId: string;
  email: string;
  tier: PlanTier;
  interval: "monthly" | "annual";
};

/**
 * Returns a URL to send the user to. In mock mode this is a local route that
 * simulates a successful upgrade with no charge; in live mode it's a real
 * Stripe Checkout session.
 */
export async function createCheckout(args: CheckoutArgs): Promise<string> {
  // Free tier never goes through Stripe — the checkout route switches it directly.
  if (args.tier === "free") {
    throw new Error("Free tier does not use Stripe checkout");
  }

  if (mock.payments) {
    return `/api/stripe/mock-complete?tier=${args.tier}`;
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripe.secretKey!);

  const priceId = {
    starter: env.stripe.priceStarter,
    pro: env.stripe.pricePro,
    max: env.stripe.priceMax,
  }[args.tier];
  if (!priceId) throw new Error(`No Stripe price configured for ${args.tier}`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: args.email,
    client_reference_id: args.userId,
    metadata: { userId: args.userId, tier: args.tier },
    success_url: `${env.appUrl}/settings?upgraded=${args.tier}`,
    cancel_url: `${env.appUrl}/pricing?canceled=1`,
  });
  return session.url!;
}

/** Verify + parse a Stripe webhook (live only). */
export async function constructWebhookEvent(payload: string, sig: string) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripe.secretKey!);
  return stripe.webhooks.constructEvent(
    payload,
    sig,
    env.stripe.webhookSecret!,
  );
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  if (priceId === env.stripe.priceStarter) return "starter";
  if (priceId === env.stripe.pricePro) return "pro";
  if (priceId === env.stripe.priceMax) return "max";
  return null;
}

export { PLANS };
