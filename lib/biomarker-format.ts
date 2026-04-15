import { resolveMeasurementSystem, type OnboardingProfile } from "@/lib/onboarding-schema";
import { formatHeightImperialFromCm, kgToLbs, roundWeightDisplay } from "@/lib/units";

export function formatBiomarkerSummaryLine(
  d: Pick<
    OnboardingProfile,
    "heightCm" | "weightKg" | "ageYears" | "measurementSystem" | "weightDisplayUnit"
  >
): string | null {
  if (d.heightCm == null || d.weightKg == null || d.ageYears == null) return null;
  const sys = resolveMeasurementSystem(d);
  const height =
    sys === "metric"
      ? `${Math.round(d.heightCm)} cm`
      : formatHeightImperialFromCm(d.heightCm);
  const weight =
    sys === "metric"
      ? `${roundWeightDisplay(d.weightKg)} kg`
      : `${roundWeightDisplay(kgToLbs(d.weightKg))} lbs`;
  return `${height} · ${weight} · age ${d.ageYears}`;
}
