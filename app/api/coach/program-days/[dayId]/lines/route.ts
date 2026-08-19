import { ExerciseLineSection } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  exerciseId: z.string().min(1),
  prescription: z.string().min(1),
  section: z.nativeEnum(ExerciseLineSection).optional(),
  setCount: z.number().int().min(1).max(20).optional(),
});

type Params = { params: Promise<{ dayId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid line data." }, { status: 400 });
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: parsed.data.exerciseId },
    select: { id: true, name: true },
  });
  if (!exercise) return NextResponse.json({ error: "Exercise not found." }, { status: 404 });

  const maxOrder = await prisma.exerciseLine.aggregate({
    where: { programDayId: dayId },
    _max: { sortOrder: true },
  });

  const line = await prisma.exerciseLine.create({
    data: {
      programDayId: dayId,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      name: exercise.name,
      prescription: parsed.data.prescription,
      exerciseId: exercise.id,
      section: parsed.data.section ?? ExerciseLineSection.STRENGTH,
      setCount: parsed.data.setCount ?? 3,
    },
  });

  return NextResponse.json({ line });
}
