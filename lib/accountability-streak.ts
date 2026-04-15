import { prisma } from "@/lib/db";

const STREAK_TARGET = 11;

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayUtcString(): string {
  const t = new Date();
  const y = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - 1));
  return utcDateString(y);
}

function startEndUtcDay(d: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

/**
 * Call when user completes a NEW program session (new WorkoutCompletion row).
 * Streak advances at most once per UTC day (caller should ensure first completion of day).
 */
export async function advanceAccountabilityStreak(userId: string): Promise<{
  streak: number;
  rewardedCredit: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyStreak: true, lastStreakDay: true, role: true },
  });
  if (!user || user.role !== "MEMBER") {
    return { streak: 0, rewardedCredit: false };
  }

  const today = utcDateString(new Date());
  const yesterday = yesterdayUtcString();

  let streak = user.loyaltyStreak;
  const last = user.lastStreakDay;

  if (!last) {
    streak = 1;
  } else if (last === today) {
    return { streak, rewardedCredit: false };
  } else if (last === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  let rewardedCredit = false;
  if (streak >= STREAK_TARGET) {
    rewardedCredit = true;
    streak -= STREAK_TARGET;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        loyaltyStreak: streak,
        lastStreakDay: today,
      },
    });

    if (rewardedCredit) {
      await tx.creditBalance.upsert({
        where: { userId },
        create: { userId, balance: 1 },
        update: { balance: { increment: 1 } },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          delta: 1,
          reason: "Accountability streak — 11-day training streak (free 1:1 session)",
        },
      });
    }
  });

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyStreak: true },
  });

  return {
    streak: updated?.loyaltyStreak ?? streak,
    rewardedCredit,
  };
}

/** First completion of the current UTC day (any session). */
export async function isFirstCompletionToday(userId: string): Promise<boolean> {
  const now = new Date();
  const { start, end } = startEndUtcDay(now);
  const count = await prisma.workoutCompletion.count({
    where: {
      userId,
      completedAt: { gte: start, lte: end },
    },
  });
  return count === 1;
}
