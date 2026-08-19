/** Fields safe to load for coach library UIs (explicit select avoids schema/DB drift crashes). */
export const coachExerciseSelect = {
  id: true,
  name: true,
  category: true,
  muscleGroup: true,
  equipment: true,
  cues: true,
  videoUrl: true,
  published: true,
  sortOrder: true,
} as const;

export type CoachExerciseRow = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string | null;
  cues: string;
  videoUrl: string | null;
  published: boolean;
  sortOrder: number;
};
