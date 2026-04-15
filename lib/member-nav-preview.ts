import { prisma } from "@/lib/db";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

export type MemberNavPreview = {
  canAccessPrograms: boolean;
  planName: string | null;
  credits: number;
  programs: Array<{ id: string; title: string; weeks: number; sessionCount: number }>;
  recentSleep: Array<{ entryDate: string; hoursAsleep: number }>;
  nextSession: { id: string; title: string; programTitle: string } | null;
};

export async function getMemberNavPreview(userId: string): Promise<MemberNavPreview> {
  const membership = await getActiveMembership(userId);
  const credits = await getCreditBalance(userId);
  const canAccessPrograms = membership?.plan.includesDigitalPrograms ?? false;
  const planName = membership?.plan.name ?? null;

  const programsFull = await prisma.program.findMany({
    where: prismaWherePublishedProgramForMember(userId),
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { days: true } },
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
        include: { completions: { where: { userId } } },
      },
    },
  });

  const programs = programsFull.map((p) => ({
    id: p.id,
    title: p.title,
    weeks: p.weeks,
    sessionCount: p._count.days,
  }));

  let nextSession: MemberNavPreview["nextSession"] = null;
  if (canAccessPrograms) {
    outer: for (const p of programsFull) {
      for (const d of p.days) {
        if (d.completions.length === 0) {
          nextSession = { id: d.id, title: d.title, programTitle: p.title };
          break outer;
        }
      }
    }
  }

  const sleepRows = await prisma.sleepJournalEntry.findMany({
    where: { userId },
    orderBy: { entryDate: "desc" },
    take: 8,
    select: { entryDate: true, hoursAsleep: true },
  });

  const recentSleep = sleepRows.map((r) => ({
    entryDate: r.entryDate,
    hoursAsleep: r.hoursAsleep,
  }));

  return {
    canAccessPrograms,
    planName,
    credits,
    programs,
    recentSleep,
    nextSession,
  };
}
