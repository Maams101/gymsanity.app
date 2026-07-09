import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { wodAttemptSchema } from "@/lib/workout-of-day-schema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = wodAttemptSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const wod = await prisma.coachWorkoutOfDay.findFirst({
    where: { id: parsed.data.wodId, published: true },
  });
  if (!wod) {
    return NextResponse.json({ error: "Workout of the day not found." }, { status: 404 });
  }

  const attempt = await prisma.workoutOfDayAttempt.upsert({
    where: {
      userId_wodId: { userId: session.sub, wodId: wod.id },
    },
    create: {
      userId: session.sub,
      wodId: wod.id,
      note: parsed.data.note?.trim() || null,
    },
    update: {
      completedAt: new Date(),
      note: parsed.data.note?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    attempt: {
      completedAt: attempt.completedAt.toISOString(),
      note: attempt.note,
    },
  });
}
