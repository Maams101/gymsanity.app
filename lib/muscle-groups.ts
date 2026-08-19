/** Primary muscle / region for library filtering (exercises may have several). */
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

/** Normalize stored groups; falls back to legacy single `muscleGroup` when array is empty. */
export function parseMuscleGroups(
  muscleGroups: string[] | null | undefined,
  legacySingle?: string | null
): MuscleGroup[] {
  const fromArray = (muscleGroups ?? []).filter(isMuscleGroup) as MuscleGroup[];
  if (fromArray.length > 0) return fromArray;
  return [parseMuscleGroup(legacySingle)];
}

export function formatMuscleGroupList(groups: MuscleGroup[]): string {
  return groups.map((g) => MUSCLE_GROUP_LABELS[g]).join(" · ");
}

export function exerciseMatchesMuscleFilter(
  muscleGroups: string[] | null | undefined,
  legacySingle: string | null | undefined,
  filter: "" | MuscleGroup
): boolean {
  if (!filter) return true;
  return parseMuscleGroups(muscleGroups, legacySingle).includes(filter);
}

/** Validate API input; returns null when invalid or empty. */
export function normalizeMuscleGroupsInput(
  muscleGroups?: string[],
  legacySingle?: string
): MuscleGroup[] | null {
  if (muscleGroups !== undefined) {
    const valid = muscleGroups.filter(isMuscleGroup) as MuscleGroup[];
    if (valid.length === 0) return null;
    return valid;
  }
  if (legacySingle !== undefined && legacySingle !== "") {
    if (!isMuscleGroup(legacySingle)) return null;
    return [legacySingle];
  }
  return ["full_body"];
}
