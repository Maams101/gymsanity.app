import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

type Params = { params: Promise<{ userId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  if (userId === session.sub) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const member = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: {
      id: true,
      memberships: {
        where: { active: true, stripeSubscriptionId: { not: null } },
        select: { stripeSubscriptionId: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (isStripeConfigured()) {
    const stripe = getStripe();
    for (const membership of member.memberships) {
      const subId = membership.stripeSubscriptionId;
      if (!subId) continue;
      try {
        await stripe.subscriptions.cancel(subId);
      } catch {
        // Continue with account removal even if Stripe cancel fails (e.g. already cancelled).
      }
    }
  }

  await prisma.user.delete({ where: { id: member.id } });

  return NextResponse.json({ ok: true });
}
