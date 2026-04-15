import { prisma } from "@/lib/db";

export async function getActiveMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, active: true },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function getCreditBalance(userId: string) {
  const row = await prisma.creditBalance.findUnique({ where: { userId } });
  return row?.balance ?? 0;
}

/** Latest unpaid / pending membership (Stripe checkout not completed). */
export async function getPendingMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, active: false },
    orderBy: { startedAt: "desc" },
    include: { plan: true },
  });
}
