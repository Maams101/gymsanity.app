import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";
import { getCoachWorkoutOfDayForEdit } from "@/lib/workout-of-day";
import { workoutOfDayWriteSchema } from "@/lib/workout-of-day-schema";

export async function GET(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dayKey = searchParams.get("day");
  if (!dayKey || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return NextResponse.json({ error: "Invalid day." }, { status: 400 });
  }

  const wod = await getCoachWorkoutOfDayForEdit(dayKey);
  return NextResponse.json({ wod });
}

export async function PUT(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = workoutOfDayWriteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid workout of the day." }, { status: 400 });
  }

  const { dayKey, title, description, blocks, published } = parsed.data;

  const row = await prisma.coachWorkoutOfDay.upsert({
    where: { dayKey },
    create: {
      dayKey,
      title,
      description: description ?? "",
      blocks: blocks as Prisma.InputJsonValue,
      published: published ?? true,
      coachUserId: session.sub,
    },
    update: {
      title,
      description: description ?? "",
      blocks: blocks as Prisma.InputJsonValue,
      published: published ?? true,
      coachUserId: session.sub,
    },
    include: { coach: { select: { name: true } } },
  });

  return NextResponse.json({
    wod: {
      id: row.id,
      dayKey: row.dayKey,
      title: row.title,
      description: row.description,
      blocks,
      published: row.published,
      coachName: row.coach.name,
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dayKey = searchParams.get("day");
  if (!dayKey || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return NextResponse.json({ error: "Invalid day." }, { status: 400 });
  }

  await prisma.coachWorkoutOfDay.deleteMany({ where: { dayKey } });
  return NextResponse.json({ ok: true });
}
