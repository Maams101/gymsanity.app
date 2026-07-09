import { prisma } from "@/lib/db";
import { localDateKey } from "@/lib/local-date";
import { parseWodBlocks, type WodBlock } from "@/lib/workout-of-day-schema";

export type CoachWorkoutOfDayView = {
  id: string;
  dayKey: string;
  title: string;
  description: string;
  blocks: WodBlock[];
  published: boolean;
  coachName: string;
  updatedAt: string;
};

export type MemberWorkoutOfDayView = CoachWorkoutOfDayView & {
  attempted: boolean;
  attemptedAt: string | null;
  attemptNote: string | null;
};

export async function getCoachWorkoutOfDayForDay(
  dayKey: string
): Promise<CoachWorkoutOfDayView | null> {
  const row = await prisma.coachWorkoutOfDay.findFirst({
    where: { dayKey, published: true },
    include: { coach: { select: { name: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    dayKey: row.dayKey,
    title: row.title,
    description: row.description,
    blocks: parseWodBlocks(row.blocks),
    published: row.published,
    coachName: row.coach.name,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCoachWorkoutOfDayForEdit(
  dayKey: string
): Promise<CoachWorkoutOfDayView | null> {
  const row = await prisma.coachWorkoutOfDay.findUnique({
    where: { dayKey },
    include: { coach: { select: { name: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    dayKey: row.dayKey,
    title: row.title,
    description: row.description,
    blocks: parseWodBlocks(row.blocks),
    published: row.published,
    coachName: row.coach.name,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getMemberWorkoutOfDay(
  userId: string,
  at = new Date()
): Promise<MemberWorkoutOfDayView | null> {
  const dayKey = localDateKey(at);
  const row = await prisma.coachWorkoutOfDay.findFirst({
    where: { dayKey, published: true },
    include: {
      coach: { select: { name: true } },
      attempts: { where: { userId }, take: 1 },
    },
  });
  if (!row) return null;
  const attempt = row.attempts[0];
  return {
    id: row.id,
    dayKey: row.dayKey,
    title: row.title,
    description: row.description,
    blocks: parseWodBlocks(row.blocks),
    published: row.published,
    coachName: row.coach.name,
    updatedAt: row.updatedAt.toISOString(),
    attempted: !!attempt,
    attemptedAt: attempt?.completedAt.toISOString() ?? null,
    attemptNote: attempt?.note ?? null,
  };
}

export async function getTodayCoachWorkoutOfDay(): Promise<CoachWorkoutOfDayView | null> {
  return getCoachWorkoutOfDayForDay(localDateKey());
}
