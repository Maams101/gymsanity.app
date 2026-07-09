import { mifflinStJeorBmr } from "@/lib/bmr-body-composition";
import type { OnboardingProfile } from "@/lib/onboarding-schema";

export type DailyMacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bmrKcal: number;
  tdeeKcal: number;
  source: "camera_bmr" | "calculated_bmr";
  goalNote: string;
};

const ACTIVITY: Record<OnboardingProfile["sessionsPerWeek"], number> = {
  "1-2": 1.375,
  "3-4": 1.55,
  "5+": 1.725,
};

function resolveBmr(profile: OnboardingProfile): number | null {
  if (profile.cameraAssessment?.bmrKcal) return profile.cameraAssessment.bmrKcal;
  if (
    profile.heightCm == null ||
    profile.weightKg == null ||
    profile.ageYears == null ||
    !profile.sexForMetrics
  ) {
    return null;
  }
  return Math.round(
    mifflinStJeorBmr(
      profile.weightKg,
      profile.heightCm,
      profile.ageYears,
      profile.sexForMetrics
    )
  );
}

function goalCalorieMultiplier(goals: OnboardingProfile["primaryGoals"]): {
  mult: number;
  note: string;
} {
  if (goals.includes("fat_loss")) {
    return { mult: 0.85, note: "Moderate deficit for sustainable fat loss" };
  }
  if (goals.includes("strength")) {
    return { mult: 1.1, note: "Slight surplus to support strength gains" };
  }
  if (goals.includes("performance")) {
    return { mult: 1.05, note: "Extra fuel for hard training blocks" };
  }
  return { mult: 1, note: "Maintenance calories for your activity level" };
}

function proteinGramsPerKg(goals: OnboardingProfile["primaryGoals"]): number {
  if (goals.includes("fat_loss")) return 2.0;
  if (goals.includes("strength")) return 1.8;
  if (goals.includes("performance")) return 1.7;
  return 1.6;
}

/** Coaching estimates from onboarding + BMR—not medical prescription. */
export function dailyMacroTargetsFromProfile(
  profile: OnboardingProfile
): DailyMacroTargets | null {
  const bmr = resolveBmr(profile);
  if (bmr == null || profile.weightKg == null) return null;

  const tdeeBase = bmr * ACTIVITY[profile.sessionsPerWeek];
  const { mult, note } = goalCalorieMultiplier(profile.primaryGoals);
  const calories = Math.round(tdeeBase * mult);

  const proteinG = Math.round(profile.weightKg * proteinGramsPerKg(profile.primaryGoals));
  const fatG = Math.round((calories * 0.28) / 9);
  const carbKcal = Math.max(0, calories - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(carbKcal / 4);

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    bmrKcal: bmr,
    tdeeKcal: Math.round(tdeeBase),
    source: profile.cameraAssessment?.bmrKcal ? "camera_bmr" : "calculated_bmr",
    goalNote: note,
  };
}
