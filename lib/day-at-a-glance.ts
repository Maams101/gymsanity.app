import { prisma } from "@/lib/db";
import { dailyMacroTargetsFromProfile, type DailyMacroTargets } from "@/lib/day-macro-targets";
import {
  formatLocalDateLong,
  localDateKey,
  localDayBounds,
  yesterdayDateKey,
} from "@/lib/local-date";
import { getActiveMembership } from "@/lib/membership";
import { nutritionPlaybookSectionsForGoals } from "@/lib/nutrition-playbooks";
import { onboardingLabels, onboardingProfileSchema } from "@/lib/onboarding-schema";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";
import { recoveryGoalsFromProfile, type RecoveryGoals } from "@/lib/recovery-goals";
import { getMemberWorkoutOfDay, type MemberWorkoutOfDayView } from "@/lib/workout-of-day";

export type DayBooking = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  type: "GROUP" | "ONE_ON_ONE";
  location: string | null;
};

export type DayTrainingItem = {
  kind: "program_session" | "booking" | "coach_wod";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  timeLabel: string | null;
  done: boolean;
};

export type DayAtAGlance = {
  dateKey: string;
  dateLabel: string;
  streak: number;
  sessionsPerWeekLabel: string;
  training: DayTrainingItem[];
  coachWorkoutOfDay: MemberWorkoutOfDayView | null;
  macros: DailyMacroTargets | null;
  nutritionTip: string | null;
  coachNutritionNote: string | null;
  recovery: RecoveryGoals | null;
  lastNightSleepHours: number | null;
  lastNightDateKey: string;
  programSessionCompletedToday: boolean;
};

export async function getDayAtAGlance(userId: string, at = new Date()): Promise<DayAtAGlance> {
  const dateKey = localDateKey(at);
  const { start, end } = localDayBounds(at);
  const lastNightKey = yesterdayDateKey(at);

  const membership = await getActiveMembership(userId);
  const canAccessPrograms = membership?.plan.includesDigitalPrograms ?? false;

  const [user, bookings, sleepLastNight, completionsToday, nutritionPlan, coachWod] =
    await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingProfile: true, loyaltyStreak: true },
    }),
    prisma.booking.findMany({
      where: {
        userId,
        status: "BOOKED",
        slot: { startAt: { gte: start, lt: end } },
      },
      orderBy: { slot: { startAt: "asc" } },
      include: { slot: true },
    }),
    prisma.sleepJournalEntry.findUnique({
      where: { userId_entryDate: { userId, entryDate: lastNightKey } },
      select: { hoursAsleep: true },
    }),
    prisma.workoutCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: start, lt: end },
      },
      select: { id: true },
    }),
    prisma.memberNutritionPlan.findUnique({
      where: { userId },
      select: { coachNotes: true },
    }),
    getMemberWorkoutOfDay(userId, at),
  ]);

  const parsed = onboardingProfileSchema.safeParse(user?.onboardingProfile ?? null);
  const profile = parsed.success ? parsed.data : null;

  let nextSession: {
    id: string;
    title: string;
    programTitle: string;
    focusNote: string | null;
    completed: boolean;
  } | null = null;

  if (canAccessPrograms) {
    const programs = await prisma.program.findMany({
      where: prismaWherePublishedProgramForMember(userId),
      orderBy: { sortOrder: "asc" },
      include: {
        days: {
          orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
          include: { completions: { where: { userId } } },
        },
      },
    });
    outer: for (const p of programs) {
      for (const d of p.days) {
        if (d.completions.length === 0) {
          nextSession = {
            id: d.id,
            title: d.title,
            programTitle: p.title,
            focusNote: d.focusNote,
            completed: false,
          };
          break outer;
        }
      }
    }
  }

  const training: DayTrainingItem[] = [];

  if (coachWod) {
    training.push({
      kind: "coach_wod",
      id: coachWod.id,
      title: coachWod.title,
      subtitle: `From ${coachWod.coachName} · ${coachWod.blocks.length} movements`,
      href: "/today#coach-wod",
      timeLabel: coachWod.attempted ? "Challenge complete" : "Coach challenge",
      done: coachWod.attempted,
    });
  }

  if (nextSession) {
    training.push({
      kind: "program_session",
      id: nextSession.id,
      title: nextSession.title,
      subtitle: nextSession.focusNote ?? nextSession.programTitle,
      href: `/sessions/${nextSession.id}`,
      timeLabel: "When you train",
      done: false,
    });
  }

  for (const b of bookings) {
    training.push({
      kind: "booking",
      id: b.id,
      title: b.slot.title ?? (b.slot.type === "GROUP" ? "Group class" : "1:1 coaching"),
      subtitle: b.slot.location ?? "Location TBD",
      href: "/book",
      timeLabel: new Date(b.slot.startAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
      done: false,
    });
  }

  const macros = profile ? dailyMacroTargetsFromProfile(profile) : null;
  const recovery = profile ? recoveryGoalsFromProfile(profile) : null;

  const nutritionSections = profile
    ? nutritionPlaybookSectionsForGoals(profile.primaryGoals)
    : [];
  const nutritionTip = nutritionSections[0]?.bullets[0] ?? null;

  const coachNote = nutritionPlan?.coachNotes?.trim() || null;

  return {
    dateKey,
    dateLabel: formatLocalDateLong(at),
    streak: user?.loyaltyStreak ?? 0,
    sessionsPerWeekLabel: profile
      ? onboardingLabels.sessionsPerWeek[profile.sessionsPerWeek]
      : "—",
    training,
    coachWorkoutOfDay: coachWod,
    macros,
    nutritionTip,
    coachNutritionNote: coachNote,
    recovery,
    lastNightSleepHours: sleepLastNight?.hoursAsleep ?? null,
    lastNightDateKey: lastNightKey,
    programSessionCompletedToday: completionsToday.length > 0,
  };
}
