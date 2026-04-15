import { prisma } from "@/lib/db";

export type LoadHistoryEntryView = {
  id: string;
  loggedAt: string;
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  programTitle: string;
  dayTitle: string;
};

export type LoadHistoryGroupView = {
  key: string;
  displayName: string;
  entries: LoadHistoryEntryView[];
};

/** One progression series per library exercise, else per program line (custom / unlinked). */
function exerciseGroupKey(exerciseId: string | null, exerciseLineId: string) {
  return exerciseId ?? exerciseLineId;
}

function exerciseDisplayName(lineName: string, libraryName: string | null) {
  return libraryName && libraryName.trim() !== "" ? libraryName : lineName;
}

/** Groups load history by linked exercise (or program line name). Newest entries first within each group. */
export async function getLoadHistoryGroupsForUser(
  userId: string,
  take = 500,
): Promise<LoadHistoryGroupView[]> {
  const rows = await prisma.exerciseLoadHistory.findMany({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    take,
    include: {
      exerciseLine: {
        select: {
          name: true,
          exerciseId: true,
          exercise: { select: { name: true } },
          programDay: {
            select: {
              title: true,
              program: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  const map = new Map<string, { displayName: string; entries: LoadHistoryEntryView[] }>();
  for (const r of rows) {
    const line = r.exerciseLine;
    const key = exerciseGroupKey(line.exerciseId, r.exerciseLineId);
    const displayName = exerciseDisplayName(line.name, line.exercise?.name ?? null);
    if (!map.has(key)) {
      map.set(key, { displayName, entries: [] });
    }
    map.get(key)!.entries.push({
      id: r.id,
      loggedAt: r.loggedAt.toISOString(),
      setIndex: r.setIndex,
      weightKg: r.weightKg,
      reps: r.reps,
      programTitle: line.programDay.program.title,
      dayTitle: line.programDay.title,
    });
  }

  const groups = [...map.entries()].map(([key, v]) => ({
    key,
    displayName: v.displayName,
    entries: v.entries,
  }));

  groups.sort((a, b) => {
    const aT = a.entries[0]?.loggedAt ?? "";
    const bT = b.entries[0]?.loggedAt ?? "";
    return bT.localeCompare(aT);
  });

  return groups;
}
