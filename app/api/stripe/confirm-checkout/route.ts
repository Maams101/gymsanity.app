import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/get-session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  activateMembershipAfterCheckout,
  activateMembershipAfterOneTimePayment,
} from "@/lib/stripe-subscription";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";

const schema = z.object({
  sessionId: z.string().min(1),
});

/**
 * Backup to webhooks: after Checkout return, confirm the paid session and activate
 * membership/credits if the webhook has not landed yet.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
  }

  const checkout = await getStripe().checkout.sessions.retrieve(parsed.data.sessionId);
  const ownerId = checkout.metadata?.userId ?? checkout.client_reference_id;
  if (!ownerId || ownerId !== session.sub) {
    return NextResponse.json({ error: "Checkout session mismatch." }, { status: 403 });
  }

  if (checkout.status !== "complete" || checkout.payment_status !== "paid") {
    return NextResponse.json({
      ok: false,
      ready: false,
      status: checkout.status,
      paymentStatus: checkout.payment_status,
    });
  }

  const customerId =
    typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null;

  if (checkout.mode === "subscription") {
    const subId =
      typeof checkout.subscription === "string"
        ? checkout.subscription
        : checkout.subscription?.id;
    if (subId) {
      await activateMembershipAfterCheckout(session.sub, subId, customerId);
    }
  } else if (checkout.mode === "payment") {
    await activateMembershipAfterOneTimePayment(
      session.sub,
      customerId,
      checkout.id,
      checkout.metadata?.planSlug
    );
  }

  const membership = await getActiveMembership(session.sub);
  const credits = await getCreditBalance(session.sub);

  return NextResponse.json({
    ok: true,
    ready: Boolean(membership),
    membership,
    credits,
  });
}
