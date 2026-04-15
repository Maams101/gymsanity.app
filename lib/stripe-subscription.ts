import { PlanBillingType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Called from Stripe webhook after Checkout completes in payment mode (coaching packs).
 * Idempotent via completedCheckoutSessionId.
 */
export async function activateMembershipAfterOneTimePayment(
  userId: string,
  stripeCustomerId: string,
  checkoutSessionId: string
) {
  await prisma.$transaction(async (tx) => {
    const dup = await tx.membership.findFirst({
      where: { completedCheckoutSessionId: checkoutSessionId },
    });
    if (dup) return;

    const membership = await tx.membership.findFirst({
      where: { userId, active: false },
      orderBy: { startedAt: "desc" },
      include: { plan: true },
    });
    if (!membership || membership.plan.billingType !== PlanBillingType.ONE_TIME) return;

    await tx.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });

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
  stripeCustomerId: string
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

    await tx.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });

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
