/** Primary muscle / region for library filtering (one value per exercise). */
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "full_body",
  "cardio",
  "mobility",
  "recovery",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quadriceps: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core / abs",
  full_body: "Full body",
  cardio: "Cardio / conditioning",
  mobility: "Mobility / prep",
  recovery: "Recovery / breath",
};

/** Order for optgroups and library sections */
export const MUSCLE_GROUPS_ORDER: readonly MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "full_body",
  "cardio",
  "mobility",
  "recovery",
];

const SET = new Set<string>(MUSCLE_GROUPS);

export function isMuscleGroup(value: string): value is MuscleGroup {
  return SET.has(value);
}

export function parseMuscleGroup(value: string | undefined | null): MuscleGroup {
  if (value && isMuscleGroup(value)) return value;
  return "full_body";
}
