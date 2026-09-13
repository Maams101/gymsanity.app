import { PlanBillingType, type Membership, type Plan } from "@prisma/client";
import { prisma } from "@/lib/db";

type MembershipWithPlan = Membership & { plan: Plan };

/**
 * Called from Stripe webhook after Checkout completes in payment mode (coaching packs).
 * Idempotent via completedCheckoutSessionId.
 */
export async function activateMembershipAfterOneTimePayment(
  userId: string,
  stripeCustomerId: string | null | undefined,
  checkoutSessionId: string,
  planSlug?: string | null
) {
  await prisma.$transaction(async (tx) => {
    const dup = await tx.membership.findFirst({
      where: { completedCheckoutSessionId: checkoutSessionId },
    });
    if (dup) return;

    // Prefer the plan purchased in this Checkout (metadata), not a stale pending membership.
    let membership: MembershipWithPlan | null = null;

    if (planSlug) {
      const plan = await tx.plan.findUnique({ where: { slug: planSlug } });
      if (plan?.billingType === PlanBillingType.ONE_TIME) {
        const pendingForPlan = await tx.membership.findFirst({
          where: { userId, planId: plan.id, active: false },
          orderBy: { startedAt: "desc" },
          include: { plan: true },
        });
        membership =
          pendingForPlan ??
          (await tx.membership.create({
            data: { userId, planId: plan.id, active: false },
            include: { plan: true },
          }));
      }
    }

    if (!membership) {
      membership = await tx.membership.findFirst({
        where: { userId, active: false },
        orderBy: { startedAt: "desc" },
        include: { plan: true },
      });
    }

    if (!membership || membership.plan.billingType !== PlanBillingType.ONE_TIME) return;

    if (stripeCustomerId) {
      await tx.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    await tx.membership.update({
      where: { id: membership.id },
      data: {
        active: true,
        stripeSubscriptionId: null,
        completedCheckoutSessionId: checkoutSessionId,
      },
    });

    const sessions = membership.plan.oneOnOneCreditsPerMonth;
    await tx.creditBalance.upsert({
      where: { userId },
      create: { userId, balance: sessions },
      update: { balance: { increment: sessions } },
    });

    if (sessions > 0) {
      await tx.creditLedger.create({
        data: {
          userId,
          delta: sessions,
          reason: `Coaching pack — ${membership.plan.name}`,
        },
      });
    }
  });
}

/**
 * Called from Stripe webhook after checkout completes (subscription mode).
 * Idempotent: safe if webhook retries.
 */
export async function activateMembershipAfterCheckout(
  userId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string | null | undefined
) {
  await prisma.$transaction(async (tx) => {
    const alreadyActive = await tx.membership.findFirst({
      where: { stripeSubscriptionId, active: true },
    });
    if (alreadyActive) return;

    const membership = await tx.membership.findFirst({
      where: { userId, active: false },
      orderBy: { startedAt: "desc" },
      include: { plan: true },
    });
    if (!membership || membership.plan.billingType !== PlanBillingType.SUBSCRIPTION) return;

    if (stripeCustomerId) {
      await tx.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    await tx.membership.update({
      where: { id: membership.id },
      data: { active: true, stripeSubscriptionId },
    });

    const allocation = membership.plan.oneOnOneCreditsPerMonth;
    await tx.creditBalance.upsert({
      where: { userId },
      create: { userId, balance: allocation },
      update: { balance: allocation },
    });

    if (allocation > 0) {
      await tx.creditLedger.create({
        data: {
          userId,
          delta: allocation,
          reason: `Subscription activated — ${membership.plan.name}`,
        },
      });
    }
  });
}

export async function syncSubscriptionStatus(stripeSubscriptionId: string, status: string) {
  const activeStatuses = ["active", "trialing"];
  const active = activeStatuses.includes(status);

  await prisma.membership.updateMany({
    where: { stripeSubscriptionId },
    data: { active },
  });
}

export async function deactivateMembershipBySubscription(stripeSubscriptionId: string) {
  await prisma.membership.updateMany({
    where: { stripeSubscriptionId },
    data: { active: false },
  });
}
