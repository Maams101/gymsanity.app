import { NewsletterSource, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { COOKIE, signSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertNewsletterSubscription } from "@/lib/newsletter";
import { getActiveMembership } from "@/lib/membership";

export const FOCUS_GROUP_PLAN_SLUG = "focus-group";
export const FOCUS_GROUP_JOIN_PATH = "/join/focus-group";
export const FOCUS_GROUP_PROGRAM_TITLE =
  process.env.FOCUS_GROUP_PROGRAM_TITLE?.trim() || "Focus Group Challenge";

export async function isFocusGroupMember(userId: string): Promise<boolean> {
  const membership = await getActiveMembership(userId);
  return membership?.plan.slug === FOCUS_GROUP_PLAN_SLUG;
}

export async function getFocusGroupFeedbackCount(): Promise<number> {
  return prisma.focusGroupFeedback.count();
}

export async function getFocusGroupProgramPath(): Promise<string> {
  const program = await prisma.program.findFirst({
    where: {
      title: FOCUS_GROUP_PROGRAM_TITLE,
      published: true,
      assignedMemberId: null,
    },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });
  return program ? `/programs/${program.id}` : "/programs";
}

async function getFocusGroupPlan() {
  const plan = await prisma.plan.findUnique({ where: { slug: FOCUS_GROUP_PLAN_SLUG } });
  if (!plan) {
    throw new Error("Focus group plan not configured.");
  }
  return plan;
}

/** Assign focus-group plan as the member's active membership. */
export async function assignFocusGroupMembership(userId: string): Promise<void> {
  const plan = await getFocusGroupPlan();

  await prisma.membership.updateMany({
    where: { userId, active: true },
    data: { active: false },
  });

  const existing = await prisma.membership.findFirst({
    where: { userId, planId: plan.id },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    await prisma.membership.update({
      where: { id: existing.id },
      data: { active: true, endsAt: null },
    });
  } else {
    await prisma.membership.create({
      data: { userId, planId: plan.id, active: true },
    });
  }

  await prisma.creditBalance.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

type FocusGroupSignupInput = {
  name: string;
  email: string;
  password: string;
};

export async function registerFocusGroupMember(
  input: FocusGroupSignupInput
): Promise<{ user: User; sessionToken: string }> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new FocusGroupSignupError("An account with this email already exists.", 409);
  }

  const plan = await getFocusGroupPlan();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      memberships: {
        create: { planId: plan.id, active: true },
      },
    },
  });

  await prisma.creditBalance.create({ data: { userId: user.id, balance: 0 } });

  await upsertNewsletterSubscription({
    email: user.email,
    name: user.name,
    source: NewsletterSource.INVITE,
    userId: user.id,
  }).catch((err) => console.error("newsletter subscribe on focus-group signup failed", err));

  const sessionToken = await signSession({ sub: user.id, email: user.email, role: user.role });
  return { user, sessionToken };
}

export class FocusGroupSignupError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}
