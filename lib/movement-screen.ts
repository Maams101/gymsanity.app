import type { MobilityBand } from "@/lib/onboarding-pose-metrics";

/** 1–3 scale used in functional movement screens (3 = pattern looks clear). Pain is not scored here. */
export type ScreenScore = 1 | 2 | 3;

export type MovementPatternId = "deep_squat" | "shoulder_mobility";

export type MovementPatternResult = {
  id: MovementPatternId;
  name: string;
  score: ScreenScore;
  band: MobilityBand;
  whatWeSaw: string;
  coachingFocus: string;
};

export type MovementScreen = {
  deepSquat: MovementPatternResult;
  shoulderMobility: MovementPatternResult;
  priority: MovementPatternId | "balanced";
  summary: string;
};

const SCORE_LABEL: Record<ScreenScore, string> = {
  1: "Limited",
  2: "Acceptable",
  3: "Clear",
};

export function screenScoreLabel(score: ScreenScore): string {
  return SCORE_LABEL[score];
}

export function bandToScore(band: MobilityBand): ScreenScore {
  if (band === "good") return 3;
  if (band === "typical") return 2;
  return 1;
}

export function interpretDeepSquat(minKneeDeg: number, band: MobilityBand): MovementPatternResult {
  const score = bandToScore(band);
  const whatWeSaw =
    score === 3
      ? "You reached a deep squat with a small knee angle, similar to a cleared overhead squat pattern (hips, knees, and ankles allowing depth)."
      : score === 2
        ? "You found moderate squat depth. That often shows up when the pattern works with a little compensation (ankles, hips, or torso)."
        : "Squat depth stayed high (a shallower fold). In a functional screen this is a limited deep-squat pattern, not a strength grade.";

  const coachingFocus =
    score === 3
      ? "Keep training the squat as a loaded pattern. Use it as a baseline, not a reason to skip mobility work."
      : score === 2
        ? "Coach the squat with a box, a slightly elevated heel, or a goblet hold so the torso stays tall while depth improves."
        : "Prioritize ankle dorsiflexion, hip flexion, and a tall torso. Start with sit-to-stand, heel-elevated squats, and pain-free range — not max load.";

  return {
    id: "deep_squat",
    name: "Deep squat",
    score,
    band,
    whatWeSaw: Number.isFinite(minKneeDeg)
      ? `${whatWeSaw} Deepest knee angle on camera: ${Math.round(minKneeDeg)}°.`
      : whatWeSaw,
    coachingFocus,
  };
}

export function interpretShoulderMobility(maxOpeningDeg: number, band: MobilityBand): MovementPatternResult {
  const score = bandToScore(band);
  const whatWeSaw =
    score === 3
      ? "Your arm reached a large overhead opening, in line with a cleared shoulder-mobility pattern (thorax, scapula, and glenohumeral joint cooperating)."
      : score === 2
        ? "Overhead reach was usable but not fully open. Screens like this often flag stiff lats, limited thoracic extension, or guarded rotation."
        : "Overhead opening stayed small. That is a limited shoulder-mobility pattern on this screen — treat it as range and control, not a max-effort test.";

  const coachingFocus =
    score === 3
      ? "You can load overhead work. Still check that ribs stay down and the neck stays quiet when the arm goes up."
      : score === 2
        ? "Blend thoracic extension, wall slides, and controlled reach before heavy overhead pressing."
        : "Restore range first: open-book rotations, lat length, and assisted reach. Avoid forcing end-range overhead load.";

  return {
    id: "shoulder_mobility",
    name: "Shoulder mobility",
    score,
    band,
    whatWeSaw: Number.isFinite(maxOpeningDeg)
      ? `${whatWeSaw} Peak arm opening on camera: ${Math.round(maxOpeningDeg)}°.`
      : whatWeSaw,
    coachingFocus,
  };
}

export function resolveMovementScreen(assessment: {
  mobility: {
    shoulderOpeningMaxDeg: number;
    squatMinKneeDeg: number;
    shoulderMobility: MobilityBand;
    hipMobility: MobilityBand;
  };
  movementScreen?: MovementScreen;
}): MovementScreen {
  if (assessment.movementScreen) return assessment.movementScreen;
  return buildMovementScreen(
    assessment.mobility.shoulderOpeningMaxDeg,
    assessment.mobility.squatMinKneeDeg,
    assessment.mobility.shoulderMobility,
    assessment.mobility.hipMobility
  );
}

export function formatMovementScreenLine(screen: MovementScreen): string {
  return `Deep squat ${screen.deepSquat.score}/3 (${screenScoreLabel(screen.deepSquat.score)}) · Shoulder mobility ${screen.shoulderMobility.score}/3 (${screenScoreLabel(screen.shoulderMobility.score)}). ${screen.summary}`;
}

export function buildMovementScreen(
  shoulderMaxDeg: number,
  squatMinKneeDeg: number,
  shoulderBand: MobilityBand,
  hipBand: MobilityBand
): MovementScreen {
  const deepSquat = interpretDeepSquat(squatMinKneeDeg, hipBand);
  const shoulderMobility = interpretShoulderMobility(shoulderMaxDeg, shoulderBand);
  const priority: MovementScreen["priority"] =
    deepSquat.score === shoulderMobility.score
      ? "balanced"
      : deepSquat.score < shoulderMobility.score
        ? "deep_squat"
        : "shoulder_mobility";

  const summary =
    priority === "balanced"
      ? `Both patterns scored ${deepSquat.score}/3. Train them together and watch the lower score if it drops.`
      : priority === "deep_squat"
        ? `Priority pattern: deep squat (${deepSquat.score}/3). Shoulder reach scored ${shoulderMobility.score}/3.`
        : `Priority pattern: shoulder mobility (${shoulderMobility.score}/3). Deep squat scored ${deepSquat.score}/3.`;

  return { deepSquat, shoulderMobility, priority, summary };
}
