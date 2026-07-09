/** Mifflin–St Jeor BMR (kcal/day). Weight kg, height cm, age years. */
export function mifflinStJeorBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: "male" | "female" | "prefer_not"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return (base + 5 + (base - 161)) / 2;
}

/** Body-mass index (kg/m²). */
export function bodyMassIndex(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  if (h <= 0) return NaN;
  return weightKg / (h * h);
}

/**
 * Deurenberg-style estimate from BMI + age + sex (not a DXA replacement).
 * Deurenberg et al., Int J Obes 1991.
 */
export function deurenbergBodyFatPercent(
  bmi: number,
  ageYears: number,
  sex: "male" | "female" | "prefer_not"
): number {
  if (!Number.isFinite(bmi) || bmi < 10 || bmi > 60) return NaN;
  if (sex === "male") {
    return 1.2 * bmi + 0.23 * ageYears - 10.8 * 1 - 5.4;
  }
  if (sex === "female") {
    return 1.2 * bmi + 0.23 * ageYears - 10.8 * 0 - 5.4;
  }
  const m = 1.2 * bmi + 0.23 * ageYears - 10.8 * 1 - 5.4;
  const f = 1.2 * bmi + 0.23 * ageYears - 5.4;
  return (m + f) / 2;
}

export function clampBodyFatPercent(n: number): number {
  if (!Number.isFinite(n)) return NaN;
  return Math.min(55, Math.max(6, n));
}

/** Fat-free mass (kg) from body mass and estimated body fat %. */
export function leanBodyMassKg(weightKg: number, bodyFatPercent: number): number {
  const bf = Math.min(60, Math.max(4, bodyFatPercent)) / 100;
  return weightKg * (1 - bf);
}

/**
 * Rough skeletal muscle mass (kg): lean mass × a sex-specific fraction typical of
 * whole-body composition aggregates (not DXA—coaching estimate only).
 */
export function estimatedSkeletalMuscleMassKg(
  leanMassKg: number,
  sex: "male" | "female" | "prefer_not"
): number {
  const fraction = sex === "male" ? 0.49 : sex === "female" ? 0.41 : 0.45;
  return leanMassKg * fraction;
}
