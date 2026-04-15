/** Plans shown at register and /subscribe (no Hybrid). */
export const OFFERED_MEMBER_PLAN_SLUGS = ["digital", "elite"] as const;

export function isOfferedMemberPlanSlug(slug: string): boolean {
  return (OFFERED_MEMBER_PLAN_SLUGS as readonly string[]).includes(slug);
}
