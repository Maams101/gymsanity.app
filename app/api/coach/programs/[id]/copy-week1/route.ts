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

  const daysByWeekAndIndex = new Map<string, { id: string }>();
  for (const day of program.days) {
    daysByWeekAndIndex.set(`${day.weekNumber}:${day.dayIndex}`, { id: day.id });
  }

  const missingDays: {
    programId: string;
    weekNumber: number;
    dayIndex: number;
    title: string;
    focusNote: string | null;
  }[] = [];

  for (let week = 2; week <= targetWeeks; week++) {
    for (const template of week1Days) {
      const key = `${week}:${template.dayIndex}`;
      if (!daysByWeekAndIndex.has(key)) {
        missingDays.push({
          programId: id,
          weekNumber: week,
          dayIndex: template.dayIndex,
          title: template.title,
          focusNote: template.focusNote,
        });
      }
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        if (missingDays.length > 0) {
          await tx.programDay.createMany({ data: missingDays });
          const created = await tx.programDay.findMany({
            where: {
              programId: id,
              weekNumber: { gte: 2, lte: targetWeeks },
            },
            select: { id: true, weekNumber: true, dayIndex: true },
          });
          for (const day of created) {
            daysByWeekAndIndex.set(`${day.weekNumber}:${day.dayIndex}`, {
              id: day.id,
            });
          }
        }

        const targetDayIds: string[] = [];
        for (let week = 2; week <= targetWeeks; week++) {
          for (const template of week1Days) {
            const target = daysByWeekAndIndex.get(`${week}:${template.dayIndex}`);
            if (target) targetDayIds.push(target.id);
          }
        }

        if (targetDayIds.length > 0) {
          await tx.exerciseLine.deleteMany({
            where: { programDayId: { in: targetDayIds } },
          });
        }

        const linesToCreate: {
          programDayId: string;
          sortOrder: number;
          name: string;
          prescription: string;
          exerciseId: string | null;
          section: (typeof week1Days)[number]["exercises"][number]["section"];
          setCount: number;
          pairGroupId: string | null;
          pairType: (typeof week1Days)[number]["exercises"][number]["pairType"];
          pairOrder: number | null;
        }[] = [];

        for (let week = 2; week <= targetWeeks; week++) {
          for (const template of week1Days) {
            const target = daysByWeekAndIndex.get(`${week}:${template.dayIndex}`);
            if (!target || template.exercises.length === 0) continue;

            const pairIdMap = new Map<string, string>();
            for (const line of template.exercises) {
              if (line.pairGroupId && !pairIdMap.has(line.pairGroupId)) {
                pairIdMap.set(line.pairGroupId, randomUUID());
              }
            }

            for (const line of template.exercises) {
              linesToCreate.push({
                programDayId: target.id,
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
              });
            }
          }
        }

        if (linesToCreate.length > 0) {
          await tx.exerciseLine.createMany({ data: linesToCreate });
        }

        if (program.weeks < targetWeeks) {
          await tx.program.update({
            where: { id },
            data: { weeks: targetWeeks },
          });
        }
      },
      { maxWait: 15_000, timeout: 60_000 }
    );
  } catch (err) {
    console.error("copy-week1 failed", err);
    return NextResponse.json(
      { error: "Could not copy Week 1 across the program. Try again." },
      { status: 500 }
    );
  }

  const updated = await prisma.program.findUnique({
    where: { id },
    include: programInclude,
  });

  return NextResponse.json({ program: updated });
}
