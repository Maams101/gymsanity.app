import { onboardingLabels, type OnboardingProfile } from "@/lib/onboarding-schema";

export type SleepTarget = {
  minHours: number;
  maxHours: number;
  label: string;
  aspirational: string;
};

export type RecoveryPracticeGoal = {
  key: keyof typeof onboardingLabels.recoveryPractices;
  label: string;
};

export type RecoveryGoals = {
  sleepTarget: SleepTarget;
  stressLevel: string;
  practices: RecoveryPracticeGoal[];
  dailyFocus: string[];
};

const SLEEP_TARGETS: Record<
  OnboardingProfile["sleepHours"],
  SleepTarget
> = {
  under6: {
    minHours: 7,
    maxHours: 8,
    label: "7–8 hours tonight",
    aspirational: "You reported sleeping under 6 h—aim to add 1–2 h this week.",
  },
  "6-7": {
    minHours: 7,
    maxHours: 8,
    label: "7–8 hours tonight",
    aspirational: "Close the gap toward a full 7–8 h window.",
  },
  "7-8": {
    minHours: 7,
    maxHours: 8,
    label: "7–8 hours (maintain)",
    aspirational: "Protect the rhythm you already have.",
  },
  "8+": {
    minHours: 8,
    maxHours: 9,
    label: "8+ hours",
    aspirational: "Prioritize deep, uninterrupted sleep on hard training days.",
  },
};

export function recoveryGoalsFromProfile(profile: OnboardingProfile): RecoveryGoals {
  const sleepTarget = SLEEP_TARGETS[profile.sleepHours];
  const practices = profile.recoveryPractices
    .filter((k) => k !== "none")
    .map((key) => ({
      key,
      label: onboardingLabels.recoveryPractices[key],
    }));

  const dailyFocus: string[] = [
    `Wind down for ${sleepTarget.label.toLowerCase()}.`,
  ];

  if (profile.stressLevel === "high") {
    dailyFocus.push("5 minutes of slow breathing or a short walk to downshift stress.");
  } else if (profile.stressLevel === "moderate") {
    dailyFocus.push("One screen-free break before bed.");
  }

  for (const p of practices.slice(0, 2)) {
    dailyFocus.push(`Make time for ${p.label.toLowerCase()}.`);
  }

  if (profile.primaryGoals.includes("mobility")) {
    dailyFocus.push("10 minutes of mobility or gentle movement outside training.");
  }

  return {
    sleepTarget,
    stressLevel: onboardingLabels.stressLevel[profile.stressLevel],
    practices,
    dailyFocus,
  };
}
