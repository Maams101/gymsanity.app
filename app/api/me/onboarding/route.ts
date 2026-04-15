import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { onboardingProfileSchema } from "@/lib/onboarding-schema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Only members complete onboarding." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = onboardingProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or incomplete answers." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      onboardingProfile: parsed.data as Prisma.InputJsonValue,
      onboardingCompletedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
