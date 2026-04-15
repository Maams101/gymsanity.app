/** SI definition: 1 lb = 0.45359237 kg */
const LB_TO_KG = 0.45359237;
const CM_PER_INCH = 2.54;

export function lbsToKg(lbs: number): number {
  return lbs * LB_TO_KG;
}

export function kgToLbs(kg: number): number {
  return kg / LB_TO_KG;
}

/** One decimal for display inputs and summaries */
export function roundWeightDisplay(n: number): number {
  return Math.round(n * 10) / 10;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

/** Whole feet + remaining inches (one decimal on inches). */
export function splitFeetInches(totalInches: number): { feet: number; inches: number } {
  const feet = Math.floor(totalInches / 12);
  const inchesRounded = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inchesRounded >= 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches: inchesRounded };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

/** e.g. 5′ 10.1″ */
export function formatHeightImperialFromCm(cm: number): string {
  const { feet, inches } = splitFeetInches(cmToInches(cm));
  const inchStr = Number.isInteger(inches) ? String(inches) : inches.toFixed(1);
  return `${feet}′ ${inchStr}″`;
}
