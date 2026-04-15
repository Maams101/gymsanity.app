import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing profile yet." }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = appBaseUrl();

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
