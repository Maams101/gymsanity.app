import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { memberCanAccessExerciseLine } from "@/lib/exercise-line-access";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";

const schema = z.object({
  exerciseLineId: z.string().min(1),
  setIndex: z.number().int().min(1).max(20),
  done: z.boolean(),
  weightKg: z.union([z.number().min(0).max(2000), z.null()]).optional(),
  reps: z.union([z.number().int().min(0).max(2000), z.null()]).optional(),
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

  const line = await memberCanAccessExerciseLine(session.sub, parsed.data.exerciseLineId);
  if (!line) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const maxSets = Math.min(20, Math.max(1, line.setCount));
  if (parsed.data.setIndex > maxSets) {
    return NextResponse.json({ error: "Invalid set number for this exercise." }, { status: 400 });
  }

  const { exerciseLineId, setIndex, done, weightKg, reps } = parsed.data;

  if (done) {
    const updatePayload: Prisma.ExerciseSetLogUncheckedUpdateInput = {
      completedAt: new Date(),
    };
    if (weightKg !== undefined) updatePayload.weightKg = weightKg;
    if (reps !== undefined) updatePayload.reps = reps;

    await prisma.exerciseSetLog.upsert({
      where: {
        userId_exerciseLineId_setIndex: {
          userId: session.sub,
          exerciseLineId: line.id,
          setIndex,
        },
      },
      create: {
        userId: session.sub,
        exerciseLineId: line.id,
        setIndex,
        weightKg: weightKg !== undefined ? weightKg : null,
        reps: reps !== undefined ? reps : null,
      },
      update: updatePayload,
    });

    const logLoad =
      (weightKg !== undefined && weightKg !== null) ||
      (reps !== undefined && reps !== null);
    if (logLoad) {
      await prisma.exerciseLoadHistory.create({
        data: {
          userId: session.sub,
          exerciseLineId: line.id,
          setIndex,
          weightKg: typeof weightKg === "number" ? weightKg : null,
          reps: typeof reps === "number" ? reps : null,
        },
      });
    }
  } else {
    await prisma.exerciseSetLog.deleteMany({
      where: {
        userId: session.sub,
        exerciseLineId,
        setIndex,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
