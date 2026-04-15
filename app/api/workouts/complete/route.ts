import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { advanceAccountabilityStreak, isFirstCompletionToday } from "@/lib/accountability-streak";
import { getActiveMembership } from "@/lib/membership";
import { memberCanAccessPublishedProgram } from "@/lib/program-visibility";

const schema = z.object({
  programDayId: z.string().min(1),
  note: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getActiveMembership(session.sub);
  if (!membership || !membership.plan.includesDigitalPrograms) {
    return NextResponse.json({ error: "Your plan does not include programming." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const day = await prisma.programDay.findUnique({
    where: { id: parsed.data.programDayId },
    include: { program: true },
  });
  if (
    !day ||
    !memberCanAccessPublishedProgram(day.program, session.sub)
  ) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const existing = await prisma.workoutCompletion.findUnique({
    where: {
      userId_programDayId: {
        userId: session.sub,
        programDayId: day.id,
      },
    },
  });

  await prisma.workoutCompletion.upsert({
    where: {
      userId_programDayId: {
        userId: session.sub,
        programDayId: day.id,
      },
    },
    create: {
      userId: session.sub,
      programDayId: day.id,
      note: parsed.data.note,
    },
    update: {
      completedAt: new Date(),
      note: parsed.data.note,
    },
  });

  let accountability: { streak: number; rewardedCredit: boolean } | undefined;
  if (!existing) {
    const firstToday = await isFirstCompletionToday(session.sub);
    if (firstToday) {
      accountability = await advanceAccountabilityStreak(session.sub);
    } else {
      const u = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { loyaltyStreak: true },
      });
      accountability = { streak: u?.loyaltyStreak ?? 0, rewardedCredit: false };
    }
  }

  return NextResponse.json({ ok: true, accountability });
}
