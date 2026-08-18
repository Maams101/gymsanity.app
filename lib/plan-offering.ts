import { SESSION_PACKS, type SessionPackSlug } from "@/lib/session-packs";

/** Plans shown at register and /subscribe. */
export const OFFERED_MEMBER_PLAN_SLUGS = [
  "digital",
  ...SESSION_PACKS.map((p) => p.slug),
] as const;

export type OfferedMemberPlanSlug = (typeof OFFERED_MEMBER_PLAN_SLUGS)[number];

export function isOfferedMemberPlanSlug(slug: string): slug is OfferedMemberPlanSlug {
  return (OFFERED_MEMBER_PLAN_SLUGS as readonly string[]).includes(slug);
}

export function isSessionPackPlanSlug(slug: string): slug is SessionPackSlug {
  return SESSION_PACKS.some((p) => p.slug === slug);
}
