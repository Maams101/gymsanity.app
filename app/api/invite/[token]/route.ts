import { NewsletterSource } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE, signSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertNewsletterSubscription } from "@/lib/newsletter";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.focusGroupInvite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Invite link not found." }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "This invite link has already been used." }, { status: 409 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const focusGroupPlan = await prisma.plan.findUnique({ where: { slug: "focus-group" } });
  if (!focusGroupPlan) {
    return NextResponse.json({ error: "Focus group plan not configured." }, { status: 500 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      memberships: {
        create: { planId: focusGroupPlan.id, active: true },
      },
    },
  });

  await prisma.creditBalance.create({ data: { userId: user.id, balance: 0 } });

  await prisma.focusGroupInvite.update({
    where: { token },
    data: { usedAt: new Date(), usedByUserId: user.id },
  });

  await upsertNewsletterSubscription({
    email: user.email,
    name: user.name,
    source: NewsletterSource.INVITE,
    userId: user.id,
  }).catch((err) => console.error("newsletter subscribe on invite failed", err));

  const sessionToken = await signSession({ sub: user.id, email: user.email, role: user.role });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
