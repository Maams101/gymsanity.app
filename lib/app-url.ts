/**
 * Canonical public origin for redirects, Stripe return URLs, and metadata.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://gymsanity.fit — no trailing slash).
 */
export function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
