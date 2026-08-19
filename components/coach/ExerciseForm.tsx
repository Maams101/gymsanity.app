"use client";

import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS_ORDER,
  parseMuscleGroups,
  type MuscleGroup,
} from "@/lib/muscle-groups";
import { useEffect, useState } from "react";

export type ExerciseRecord = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  muscleGroups?: string[];
  equipment: string | null;
  cues: string;
  videoUrl?: string | null;
  published: boolean;
};

type FormValues = {
  name: string;
  category: string;
  muscleGroups: MuscleGroup[];
  cues: string;
  equipment: string;
  videoUrl: string;
};

const EMPTY: FormValues = {
  name: "",
  category: "strength",
  muscleGroups: ["full_body"],
  cues: "",
  equipment: "",
  videoUrl: "",
};

function valuesFromExercise(ex: ExerciseRecord): FormValues {
  return {
    name: ex.name,
    category: ex.category,
    muscleGroups: parseMuscleGroups(ex.muscleGroups, ex.muscleGroup),
    cues: ex.cues,
    equipment: ex.equipment ?? "",
    videoUrl: ex.videoUrl ?? "",
  };
}

function toggleMuscleGroup(current: MuscleGroup[], mg: MuscleGroup): MuscleGroup[] {
  if (current.includes(mg)) {
    const next = current.filter((g) => g !== mg);
    return next.length > 0 ? next : current;
  }
  return [...current, mg];
}

export function ExerciseForm({
  mode,
  exerciseId,
  initial,
  compact = false,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  exerciseId?: string;
  initial?: ExerciseRecord;
  compact?: boolean;
  submitLabel?: string;
  onSuccess: (exercise: ExerciseRecord) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(
    initial ? valuesFromExercise(initial) : EMPTY
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initial ? valuesFromExercise(initial) : EMPTY);
    setError(null);
  }, [mode, exerciseId, initial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.muscleGroups.length === 0) {
      setError("Select at least one muscle group.");
      return;
    }
    setError(null);
    setBusy(true);

    const payload = {
      name: values.name,
      category: values.category,
      muscleGroups: values.muscleGroups,
      cues: values.cues,
      equipment: values.equipment || undefined,
      videoUrl: values.videoUrl || undefined,
    };

    const res =
      mode === "create"
        ? await fetch("/api/coach/exercises", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/coach/exercises/${exerciseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }

    const data = await res.json();
    onSuccess(data.exercise as ExerciseRecord);
    if (mode === "create") setValues(EMPTY);
  }

  const label = submitLabel ?? (mode === "create" ? "Save to library" : "Save changes");

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "space-y-3" : "rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"}
    >
      {!compact && (
        <>
          <h2 className="font-display text-lg font-semibold text-gymsanity-950">
            {mode === "create" ? "Add exercise" : "Edit exercise"}
          </h2>
          <p className="mt-1 text-sm text-gymsanity-800/80">
            Movements you reuse when building programs—select one or more muscle groups, add cues, optional
            demo link.
          </p>
        </>
      )}
      {error && <p className={`text-sm text-red-700 ${compact ? "" : "mt-3"}`}>{error}</p>}
      <div className={`grid gap-3 sm:grid-cols-2 ${compact ? "" : "mt-4"}`}>
        <label className="block text-sm font-medium text-gymsanity-900">
          Name *
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
        <label className="block text-sm font-medium text-gymsanity-900">
          Category
          <select
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
          >
            <option value="strength">Strength</option>
            <option value="mobility">Mobility</option>
            <option value="cardio">Cardio</option>
            <option value="core">Core</option>
            <option value="power">Power</option>
            <option value="recovery">Recovery</option>
          </select>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gymsanity-900">
          Muscle groups * <span className="font-normal text-gymsanity-700">(select all that apply)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {MUSCLE_GROUPS_ORDER.map((mg) => {
            const checked = values.muscleGroups.includes(mg);
            return (
              <label
                key={mg}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? "border-gymsanity-400 bg-gymsanity-100 text-gymsanity-950"
                    : "border-gymsanity-200 bg-white text-gymsanity-800 hover:border-gymsanity-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setValues((v) => ({
                      ...v,
                      muscleGroups: toggleMuscleGroup(v.muscleGroups, mg),
                    }))
                  }
                  className="rounded text-gymsanity-700"
                />
                {MUSCLE_GROUP_LABELS[mg]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-gymsanity-900">
        Coaching cues *
        <textarea
          required
          value={values.cues}
          onChange={(e) => setValues((v) => ({ ...v, cues: e.target.value }))}
          rows={compact ? 2 : 3}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          placeholder="Ribs down, knees track, breathe out on the effort…"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Equipment (optional)
        <input
          value={values.equipment}
          onChange={(e) => setValues((v) => ({ ...v, equipment: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Demo video URL (optional)
        <input
          value={values.videoUrl}
          onChange={(e) => setValues((v) => ({ ...v, videoUrl: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          placeholder="https://youtube.com/…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : label}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gymsanity-200 bg-white px-5 py-2.5 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
