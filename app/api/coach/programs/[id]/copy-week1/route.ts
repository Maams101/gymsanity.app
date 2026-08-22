import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  targetWeeks: z.union([z.literal(4), z.literal(8), z.literal(12)]),
});

type Params = { params: Promise<{ id: string }> };

const programInclude = {
  assignedMember: { select: { id: true, name: true, email: true } },
  days: {
    orderBy: [{ weekNumber: "asc" as const }, { dayIndex: "asc" as const }],
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" as const },
        include: { exercise: true },
      },
    },
  },
};

/** POST — copy every Week 1 session’s exercise lines into weeks 2..N */
export async function POST(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "targetWeeks must be 4, 8, or 12." },
      { status: 400 }
    );
  }

  const { targetWeeks } = parsed.data;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          exercises: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const week1Days = program.days
    .filter((d) => d.weekNumber === 1)
    .sort((a, b) => a.dayIndex - b.dayIndex);

  if (week1Days.length === 0) {
    return NextResponse.json(
      { error: "Add at least one Week 1 session before copying." },
      { status: 400 }
    );
  }

  const daysByWeekAndIndex = new Map<string, (typeof program.days)[number]>();
  for (const day of program.days) {
    daysByWeekAndIndex.set(`${day.weekNumber}:${day.dayIndex}`, day);
  }

  await prisma.$transaction(async (tx) => {
    for (let week = 2; week <= targetWeeks; week++) {
      for (const template of week1Days) {
        const key = `${week}:${template.dayIndex}`;
        let target = daysByWeekAndIndex.get(key);

        if (!target) {
          target = await tx.programDay.create({
            data: {
              programId: id,
              weekNumber: week,
              dayIndex: template.dayIndex,
              title: template.title,
              focusNote: template.focusNote,
            },
            include: { exercises: true },
          });
          daysByWeekAndIndex.set(key, target);
        }

        await tx.exerciseLine.deleteMany({ where: { programDayId: target.id } });

        if (template.exercises.length === 0) continue;

        const pairIdMap = new Map<string, string>();
        for (const line of template.exercises) {
          if (line.pairGroupId && !pairIdMap.has(line.pairGroupId)) {
            pairIdMap.set(line.pairGroupId, randomUUID());
          }
        }

        await tx.exerciseLine.createMany({
          data: template.exercises.map((line) => ({
            programDayId: target!.id,
            sortOrder: line.sortOrder,
            name: line.name,
            prescription: line.prescription,
            exerciseId: line.exerciseId,
            section: line.section,
            setCount: line.setCount,
            pairGroupId: line.pairGroupId
              ? (pairIdMap.get(line.pairGroupId) ?? null)
              : null,
            pairType: line.pairType,
            pairOrder: line.pairOrder,
          })),
        });
      }
    }

    if (program.weeks < targetWeeks) {
      await tx.program.update({
        where: { id },
        data: { weeks: targetWeeks },
      });
    }
  });

  const updated = await prisma.program.findUnique({
    where: { id },
    include: programInclude,
  });

  return NextResponse.json({ program: updated });
}
