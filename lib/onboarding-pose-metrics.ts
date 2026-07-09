import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** BlazePose / MediaPipe pose landmark indices (33-point topology). */
export const POSE = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

function angleAtB(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const baz = (a.z ?? 0) - (b.z ?? 0);
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const bcz = (c.z ?? 0) - (b.z ?? 0);
  const dot = bax * bcx + bay * bcy + baz * bcz;
  const magA = Math.hypot(bax, bay, baz);
  const magC = Math.hypot(bcx, bcy, bcz);
  if (magA < 1e-5 || magC < 1e-5) return NaN;
  let cos = dot / (magA * magC);
  cos = Math.max(-1, Math.min(1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

function visible(l: NormalizedLandmark | undefined, min = 0.45): boolean {
  if (!l) return false;
  const v = l.visibility ?? 1;
  return v >= min;
}

/** Midpoint between left and right hip in normalized image space. */
export function midHip(lm: NormalizedLandmark[]): NormalizedLandmark | null {
  const L = lm[POSE.LEFT_HIP];
  const R = lm[POSE.RIGHT_HIP];
  if (!visible(L) || !visible(R)) return null;
  return {
    x: (L.x + R.x) / 2,
    y: (L.y + R.y) / 2,
    z: ((L.z ?? 0) + (R.z ?? 0)) / 2,
    visibility: Math.min(L.visibility ?? 1, R.visibility ?? 1),
  };
}

/**
 * Shoulder “opening” angle (degrees): at the shoulder between (mid-hip → shoulder)
 * and (shoulder → wrist). Increases as the arm is raised away from the hip line.
 */
export function leftShoulderOpeningAngleDeg(lm: NormalizedLandmark[]): number {
  const hip = midHip(lm);
  const sh = lm[POSE.LEFT_SHOULDER];
  const wr = lm[POSE.LEFT_WRIST];
  if (!hip || !visible(sh) || !visible(wr)) return NaN;
  return angleAtB(hip, sh, wr);
}

export function rightShoulderOpeningAngleDeg(lm: NormalizedLandmark[]): number {
  const hip = midHip(lm);
  const sh = lm[POSE.RIGHT_SHOULDER];
  const wr = lm[POSE.RIGHT_WRIST];
  if (!hip || !visible(sh) || !visible(wr)) return NaN;
  return angleAtB(hip, sh, wr);
}

/** Best shoulder opening across sides (max of left/right). */
export function maxShoulderOpeningDeg(lm: NormalizedLandmark[]): number {
  const L = leftShoulderOpeningAngleDeg(lm);
  const R = rightShoulderOpeningAngleDeg(lm);
  if (!Number.isFinite(L) && !Number.isFinite(R)) return NaN;
  return Math.max(Number.isFinite(L) ? L : 0, Number.isFinite(R) ? R : 0);
}

/** Knee flexion angle at LEFT knee (hip–knee–ankle). ~180 standing; decreases in squat. */
export function leftKneeAngleDeg(lm: NormalizedLandmark[]): number {
  const h = lm[POSE.LEFT_HIP];
  const k = lm[POSE.LEFT_KNEE];
  const a = lm[POSE.LEFT_ANKLE];
  if (!visible(h) || !visible(k) || !visible(a)) return NaN;
  return angleAtB(h, k, a);
}

export function rightKneeAngleDeg(lm: NormalizedLandmark[]): number {
  const h = lm[POSE.RIGHT_HIP];
  const k = lm[POSE.RIGHT_KNEE];
  const a = lm[POSE.RIGHT_ANKLE];
  if (!visible(h) || !visible(k) || !visible(a)) return NaN;
  return angleAtB(h, k, a);
}

/** Deepest squat = minimum knee angle across legs (smaller = deeper). */
export function minKneeAngleDeg(lm: NormalizedLandmark[]): number {
  const L = leftKneeAngleDeg(lm);
  const R = rightKneeAngleDeg(lm);
  const vals = [L, R].filter((x) => Number.isFinite(x)) as number[];
  if (vals.length === 0) return NaN;
  return Math.min(...vals);
}

export type MobilityBand = "limited" | "typical" | "good";

/** Classify overhead / lateral shoulder mobility from peak opening angle. */
export function shoulderMobilityFromAngle(maxOpeningDeg: number): MobilityBand {
  if (!Number.isFinite(maxOpeningDeg)) return "typical";
  if (maxOpeningDeg >= 115) return "good";
  if (maxOpeningDeg >= 85) return "typical";
  return "limited";
}

/**
 * Classify squat depth from minimum knee angle during recording.
 * Deeper squat → smaller angle (more hip/ankle demand).
 */
export function hipMobilityFromMinKneeAngle(minKneeDeg: number): MobilityBand {
  if (!Number.isFinite(minKneeDeg)) return "typical";
  if (minKneeDeg <= 105) return "good";
  if (minKneeDeg <= 135) return "typical";
  return "limited";
}

export function overallMobility(shoulder: MobilityBand, hip: MobilityBand): MobilityBand {
  const rank: Record<MobilityBand, number> = { limited: 0, typical: 1, good: 2 };
  const m = Math.min(rank[shoulder], rank[hip]);
  return (Object.keys(rank) as MobilityBand[]).find((k) => rank[k] === m)!;
}
