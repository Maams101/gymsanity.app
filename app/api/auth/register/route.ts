import { NewsletterSource } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/auth";
import { upsertNewsletterSubscription } from "@/lib/newsletter";
import { isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  planSlug: z.enum(["digital", "sessions-6", "sessions-12", "sessions-24"]).default("digital"),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug } });
  if (!plan) {
    return NextResponse.json({ error: "Selected plan is not available." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const needsCheckout = isStripeConfigured() && Boolean(plan.stripePriceId);

  if (needsCheckout) {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        memberships: {
          create: {
            planId: plan.id,
            active: false,
          },
        },
      },
    });

    await prisma.creditBalance.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    await upsertNewsletterSubscription({
      email: user.email,
      name: user.name,
      source: NewsletterSource.SIGNUP,
      userId: user.id,
    }).catch((err) => console.error("newsletter subscribe on register failed", err));

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      checkoutUrl: null as string | null,
    });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      memberships: {
        create: {
          planId: plan.id,
          active: true,
        },
      },
    },
  });

  await prisma.creditBalance.create({
    data: {
      userId: user.id,
      balance: plan.oneOnOneCreditsPerMonth,
    },
  });

  if (plan.oneOnOneCreditsPerMonth > 0) {
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        delta: plan.oneOnOneCreditsPerMonth,
        reason: `Initial allocation for ${plan.name}`,
      },
    });
  }

  await upsertNewsletterSubscription({
    email: user.email,
    name: user.name,
    source: NewsletterSource.SIGNUP,
    userId: user.id,
  }).catch((err) => console.error("newsletter subscribe on register failed", err));

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true, checkoutUrl: null as string | null });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
