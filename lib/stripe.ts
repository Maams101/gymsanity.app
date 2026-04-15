import Stripe from "stripe";

export { appBaseUrl } from "@/lib/app-url";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True when in-app Embedded Checkout can run (publishable key + secret key). */
export function isEmbeddedCheckoutConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return Boolean(process.env.STRIPE_SECRET_KEY && pk && pk.startsWith("pk_"));
}

