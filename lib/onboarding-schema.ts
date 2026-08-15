import { z } from "zod";

export const mobilityBandSchema = z.enum(["limited", "typical", "good"]);
export const screenScoreSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const movementPatternSchema = z.object({
  id: z.enum(["deep_squat", "shoulder_mobility"]),
  name: z.string(),
  score: screenScoreSchema,
  band: mobilityBandSchema,
  whatWeSaw: z.string(),
  coachingFocus: z.string(),
});

/** Saved after the camera movement screen (pose-based mobility only). */
export const cameraAssessmentSchema = z.object({
  completedAt: z.string(),
  disclaimersAccepted: z.literal(true),
  /** Legacy fields from older onboarding; not shown as scan results. */
  bmrKcal: z.number().min(600).max(6000).optional(),
  bodyFatPercentEstimate: z.number().min(4).max(60).optional(),
  bodyFatMethod: z.literal("deurenberg_bmi").optional(),
  leanMassKg: z.number().min(12).max(140).optional(),
  skeletalMuscleMassEstimateKg: z.number().min(6).max(95).optional(),
  muscleMassMethod: z.literal("lbm_sex_partition").optional(),
  mobility: z.object({
    shoulderOpeningMaxDeg: z.number(),
    squatMinKneeDeg: z.number(),
    shoulderMobility: mobilityBandSchema,
    hipMobility: mobilityBandSchema,
    overallMobility: mobilityBandSchema,
  }),
  movementScreen: z
    .object({
      deepSquat: movementPatternSchema,
      shoulderMobility: movementPatternSchema,
      priority: z.enum(["deep_squat", "shoulder_mobility", "balanced"]),
      summary: z.string(),
    })
    .optional(),
  poseConfidence: z.enum(["low", "medium", "high"]).optional(),
});

export type CameraAssessment = z.infer<typeof cameraAssessmentSchema>;

/** Persisted member onboarding answers (fitness, goals, habits, health). */
export const onboardingProfileSchema = z.object({
  /// Biological markers (metric); optional for legacy profiles; wizard requires for new completions.
  heightCm: z.number().min(120).max(230).optional(),
  /** Canonical stored mass (kg). */
  weightKg: z.number().min(40).max(220).optional(),
  /** Member preference for how weight was entered / should be read (defaults to kg if omitted). */
  weightDisplayUnit: z.enum(["kg", "lbs"]).optional(),
  /** Preferred units for biomarkers; use `resolveMeasurementSystem` when reading. */
  measurementSystem: z.enum(["metric", "imperial"]).optional(),
  ageYears: z.number().int().min(16).max(100).optional(),
  trainingExperience: z.enum(["none", "beginner", "intermediate", "advanced"]),
  sessionsPerWeek: z.enum(["1-2", "3-4", "5+"]),
  equipmentAccess: z
    .array(z.enum(["full_gym", "home_db", "kettlebells", "bands_only", "bodyweight"]))
    .min(1),
  primaryGoals: z
    .array(
      z.enum([
        "strength",
        "fat_loss",
        "mobility",
        "performance",
        "mental_health",
        "routine",
        "general_health",
      ])
    )
    .min(1),
  goalDetails: z.string().max(2000).optional(),
  targetTimeline: z.enum(["asap", "3mo", "6mo", "no_rush"]),
  sleepHours: z.enum(["under6", "6-7", "7-8", "8+"]),
  stressLevel: z.enum(["low", "moderate", "high"]),
  recoveryPractices: z
    .array(z.enum(["stretching", "walks", "therapy", "breathwork", "sauna_cold", "none"]))
    .min(1),
  healthConditions: z.string().max(2000).optional(),
  medicationsSupplements: z.string().max(2000).optional(),
  injuryLimitations: z.string().max(2000).optional(),
  clearedByPhysician: z.enum(["yes", "no", "not_sure"]),
  /** Optional; used later for calorie estimates, not for the camera movement screen. */
  sexForMetrics: z.enum(["male", "female", "prefer_not"]).optional(),
  cameraAssessment: cameraAssessmentSchema.optional(),
});

export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;

export function resolveMeasurementSystem(
  d: Pick<OnboardingProfile, "measurementSystem" | "weightDisplayUnit">
): "metric" | "imperial" {
  if (d.measurementSystem) return d.measurementSystem;
  if (d.weightDisplayUnit === "lbs") return "imperial";
  return "metric";
}

export const onboardingLabels = {
  trainingExperience: {
    none: "New to structured training",
    beginner: "Beginner (< 1 year consistent)",
    intermediate: "Intermediate (1–3 years)",
    advanced: "Advanced (3+ years)",
  },
  sessionsPerWeek: {
    "1-2": "1–2 sessions",
    "3-4": "3–4 sessions",
    "5+": "5 or more",
  },
  equipmentAccess: {
    full_gym: "Full gym access",
    home_db: "Dumbbells at home",
    kettlebells: "Kettlebells",
    bands_only: "Bands / minimal equipment",
    bodyweight: "Bodyweight only",
  },
  primaryGoals: {
    strength: "Build strength",
    fat_loss: "Fat loss / recomposition",
    mobility: "Mobility & pain-free movement",
    performance: "Athletic performance",
    mental_health: "Stress relief & mental health",
    routine: "Build a sustainable routine",
    general_health: "General health & longevity",
  },
  targetTimeline: {
    asap: "As soon as realistically possible",
    "3mo": "About 3 months",
    "6mo": "About 6 months",
    no_rush: "No fixed timeline",
  },
  sleepHours: {
    under6: "Under 6 hours",
    "6-7": "6–7 hours",
    "7-8": "7–8 hours",
    "8+": "8+ hours",
  },
  stressLevel: {
    low: "Mostly low",
    moderate: "Moderate",
    high: "High / often overwhelmed",
  },
  recoveryPractices: {
    stretching: "Stretching / mobility work",
    walks: "Walking or easy cardio",
    therapy: "Physio / massage / bodywork",
    breathwork: "Breathwork / meditation",
    sauna_cold: "Sauna / cold exposure",
    none: "None right now",
  },
  clearedByPhysician: {
    yes: "Yes",
    no: "No",
    not_sure: "Not sure",
  },
} as const;

export const onboardingBiomarkerFieldLabels = {
  heightCm: "Height (cm)",
  heightImperial: "Height",
  weight: "Weight",
  weightKg: "Weight (kg)",
  weightLbs: "Weight (lbs)",
  ageYears: "Age (years)",
  measurementSystem: "Units",
} as const;
