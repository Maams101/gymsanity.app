import { CoachExerciseManager } from "@/components/coach/CoachExerciseManager";

export default function CoachExercisesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Exercise library</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Build your vocabulary of movements once—then assemble programs from these blocks with sets,
          reps, and context per client or cohort.
        </p>
      </div>
      <CoachExerciseManager />
    </div>
  );
}
