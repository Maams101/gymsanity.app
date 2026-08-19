import { prisma } from "@/lib/db";
import { getActiveMembership } from "@/lib/membership";

export const FOCUS_GROUP_PLAN_SLUG = "focus-group";

export async function isFocusGroupMember(userId: string): Promise<boolean> {
  const membership = await getActiveMembership(userId);
  return membership?.plan.slug === FOCUS_GROUP_PLAN_SLUG;
}

export async function getFocusGroupFeedbackCount(): Promise<number> {
  return prisma.focusGroupFeedback.count();
}
