import { NextResponse } from "next/server";
import { constructWebhookEvent, tierFromPriceId } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { mock } from "@/lib/env";

/** Live Stripe webhook: keeps user.plan in sync with subscription state. */
export async function POST(req: Request) {
  if (mock.payments) {
    return NextResponse.json({ received: true, mock: true });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = await constructWebhookEvent(await req.text(), sig);
  } catch (e) {
    return NextResponse.json(
      { error: `Webhook verification failed: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  const db = await getDb();

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as {
      metadata?: { userId?: string; tier?: string };
      customer?: string;
    };
    const userId = s.metadata?.userId;
    const tier = s.metadata?.tier;
    if (userId && tier) {
      await db.updateUser(userId, {
        plan: tier as never,
        stripeCustomerId: typeof s.customer === "string" ? s.customer : null,
      });
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as {
      metadata?: { userId?: string };
      status: string;
      items: { data: { price: { id: string } }[] };
    };
    const userId = sub.metadata?.userId;
    if (userId) {
      const active = sub.status === "active" || sub.status === "trialing";
      const priceId = sub.items.data[0]?.price.id;
      const tier = (priceId && tierFromPriceId(priceId)) || "free";
      await db.updateUser(userId, { plan: active ? tier : "free" });
    }
  }

  return NextResponse.json({ received: true });
}
