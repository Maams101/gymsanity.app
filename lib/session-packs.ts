export const SESSION_PACKS = [
  {
    slug: "sessions-6",
    name: "6 sessions",
    sessions: 6,
    pricePerSessionCents: 17000,
    savingsPerSessionCents: 0,
    sortOrder: 2,
  },
  {
    slug: "sessions-12",
    name: "12 sessions",
    sessions: 12,
    pricePerSessionCents: 16500,
    savingsPerSessionCents: 500,
    sortOrder: 3,
  },
  {
    slug: "sessions-24",
    name: "24 sessions",
    sessions: 24,
    pricePerSessionCents: 16000,
    savingsPerSessionCents: 1000,
    sortOrder: 4,
  },
] as const;

export type SessionPackSlug = (typeof SESSION_PACKS)[number]["slug"];

export function isSessionPackSlug(slug: string): slug is SessionPackSlug {
  return SESSION_PACKS.some((p) => p.slug === slug);
}

export function sessionPackBySlug(slug: string) {
  return SESSION_PACKS.find((p) => p.slug === slug) ?? null;
}

export function packTotalCents(pack: (typeof SESSION_PACKS)[number]): number {
  return pack.sessions * pack.pricePerSessionCents;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
