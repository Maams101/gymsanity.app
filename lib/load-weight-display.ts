import { onboardingProfileSchema, resolveMeasurementSystem } from "@/lib/onboarding-schema";
import { kgToLbs, lbsToKg, roundWeightDisplay } from "@/lib/units";

export type LoadWeightUnit = "kg" | "lbs";

export function defaultLoadWeightUnitFromOnboarding(profile: unknown): LoadWeightUnit {
  const parsed = onboardingProfileSchema.safeParse(profile);
  if (!parsed.success) return "kg";
  return resolveMeasurementSystem(parsed.data) === "imperial" ? "lbs" : "kg";
}

export function formatStoredKgForDisplay(kg: number | null, unit: LoadWeightUnit): string {
  if (kg == null) return "—";
  if (unit === "kg") return String(roundWeightDisplay(kg));
  return String(roundWeightDisplay(kgToLbs(kg)));
}

/** Parse member-entered weight in the chosen unit → kg for API (`null` = clear field). */
export function tryParseLoadInputToKg(
  raw: string,
  unit: LoadWeightUnit,
): { ok: true; kg: number | null } | { ok: false } {
  const t = raw.trim();
  if (t === "") return { ok: true, kg: null };
  const n = Number(t);
  if (Number.isNaN(n) || n < 0) return { ok: false };
  const kg = unit === "lbs" ? lbsToKg(n) : n;
  if (kg > 2000) return { ok: false };
  return { ok: true, kg };
}

export function displayKgToInputString(kg: number | null, unit: LoadWeightUnit): string {
  if (kg == null) return "";
  return unit === "kg" ? String(roundWeightDisplay(kg)) : String(roundWeightDisplay(kgToLbs(kg)));
}
