import { PlanBillingType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { isOfferedMemberPlanSlug } from "@/lib/plan-offering";
import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

const bodySchema = z.object({
  planSlug: z.string().optional(),
  /** In-app Stripe Embedded Checkout (requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY). */
  embedded: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let plan = null as Awaited<ReturnType<typeof prisma.plan.findUnique>>;

  if (parsed.data.planSlug) {
    plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug } });
  } else {
    const pending = await prisma.membership.findFirst({
      where: { userId: user.id, active: false },
      orderBy: { startedAt: "desc" },
      include: { plan: true },
    });
    plan = pending?.plan ?? null;
  }

  if (parsed.data.planSlug && plan && !isOfferedMemberPlanSlug(plan.slug)) {
    return NextResponse.json({ error: "That plan is not available." }, { status: 400 });
  }

  if (!plan?.stripePriceId) {
    return NextResponse.json(
      { error: "No Stripe price linked to this plan. Ask your coach to finish setup." },
      { status: 400 }
    );
  }

  const pendingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, active: false },
    orderBy: { startedAt: "desc" },
  });
  if (pendingMembership && pendingMembership.planId !== plan.id) {
    await prisma.membership.update({
      where: { id: pendingMembership.id },
      data: { planId: plan.id },
    });
  } else if (!pendingMembership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        planId: plan.id,
        active: false,
      },
    });
  }

  const stripe = getStripe();
  const origin = appBaseUrl();
  const embedded = parsed.data.embedded === true;

  if (embedded && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: "Embedded checkout is not configured (missing publishable key)." },
      { status: 503 }
    );
  }

  const shared = {
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, planSlug: plan.slug },
    ...(user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : { customer_email: user.email }),
  };

  const modePayload =
    plan.billingType === PlanBillingType.ONE_TIME
      ? { mode: "payment" as const, ...shared }
      : {
          mode: "subscription" as const,
          ...shared,
          subscription_data: { metadata: { userId: user.id, planSlug: plan.slug } },
        };

  const checkout = embedded
    ? await stripe.checkout.sessions.create({
        ...modePayload,
        ui_mode: "embedded",
        return_url: `${origin}/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      })
    : await stripe.checkout.sessions.create({
        ...modePayload,
        success_url: `${origin}/post-checkout`,
        cancel_url: `${origin}/subscribe?checkout=cancelled`,
      });

  if (embedded) {
    if (!checkout.client_secret) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }
    return NextResponse.json({ clientSecret: checkout.client_secret });
  }

  if (!checkout.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url });
}
