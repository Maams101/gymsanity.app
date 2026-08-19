"use client";

import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS_ORDER,
  parseMuscleGroup,
  type MuscleGroup,
} from "@/lib/muscle-groups";
import { useEffect, useMemo, useState } from "react";
import { ExerciseForm, type ExerciseRecord } from "@/components/coach/ExerciseForm";

function ExerciseListItem({
  ex,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
}: {
  ex: ExerciseRecord;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (exercise: ExerciseRecord) => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <li className="rounded-2xl border border-gymsanity-200 bg-gymsanity-50/50 p-4">
        <ExerciseForm
          mode="edit"
          exerciseId={ex.id}
          initial={ex}
          compact
          onSuccess={onSaved}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-medium text-gymsanity-950">{ex.name}</p>
        <p className="text-xs text-gymsanity-600">
          <span className="font-medium text-gymsanity-800">
            {MUSCLE_GROUP_LABELS[parseMuscleGroup(ex.muscleGroup)]}
          </span>
          <span className="mx-1.5 text-gymsanity-400">·</span>
          <span className="uppercase tracking-wide">{ex.category}</span>
        </p>
        <p className="mt-2 text-sm text-gymsanity-900/80">{ex.cues}</p>
      </div>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-gymsanity-800 hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm font-semibold text-red-700 hover:underline"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function CoachExerciseManager() {
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryMuscleFilter, setLibraryMuscleFilter] = useState<"" | MuscleGroup>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/coach/exercises");
    if (!res.ok) return;
    const data = await res.json();
    setExercises(data.exercises);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function upsertExercise(exercise: ExerciseRecord) {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === exercise.id);
      if (idx === -1) return [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name));
      const next = [...prev];
      next[idx] = exercise;
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setEditingId(null);
  }

  const librarySections = useMemo(() => {
    const byMuscle = new Map<MuscleGroup, ExerciseRecord[]>();
    for (const mg of MUSCLE_GROUPS_ORDER) byMuscle.set(mg, []);
    for (const ex of exercises) {
      const mg = parseMuscleGroup(ex.muscleGroup);
      byMuscle.get(mg)!.push(ex);
    }
    for (const list of byMuscle.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return MUSCLE_GROUPS_ORDER.map((mg) => ({
      muscle: mg,
      items: byMuscle.get(mg)!,
    })).filter((s) => s.items.length > 0);
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (!libraryMuscleFilter) return null;
    return exercises
      .filter((ex) => parseMuscleGroup(ex.muscleGroup) === libraryMuscleFilter)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, libraryMuscleFilter]);

  async function remove(id: string) {
    if (!confirm("Delete this exercise from the library?")) return;
    await fetch(`/api/coach/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function renderListItem(ex: ExerciseRecord) {
    return (
      <ExerciseListItem
        key={ex.id}
        ex={ex}
        editing={editingId === ex.id}
        onEdit={() => setEditingId(ex.id)}
        onCancelEdit={() => setEditingId(null)}
        onSaved={upsertExercise}
        onDelete={() => void remove(ex.id)}
      />
    );
  }

  return (
    <div className="space-y-10">
      <ExerciseForm mode="create" onSuccess={upsertExercise} />

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-gymsanity-950">Library</h2>
          {!loading && exercises.length > 0 && (
            <label className="block text-sm font-medium text-gymsanity-900 sm:min-w-[14rem]">
              Filter by muscle
              <select
                value={libraryMuscleFilter}
                onChange={(e) =>
                  setLibraryMuscleFilter((e.target.value || "") as "" | MuscleGroup)
                }
                className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-950"
              >
                <option value="">All groups</option>
                {MUSCLE_GROUPS_ORDER.map((mg) => (
                  <option key={mg} value={mg}>
                    {MUSCLE_GROUP_LABELS[mg]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-gymsanity-800">Loading…</p>
        ) : exercises.length === 0 ? (
          <p className="mt-3 text-sm text-gymsanity-800">No exercises yet. Add your first above.</p>
        ) : libraryMuscleFilter ? (
          filteredExercises && filteredExercises.length === 0 ? (
            <p className="mt-3 text-sm text-gymsanity-800">No exercises in this group.</p>
          ) : (
            <ul className="mt-4 space-y-3">{filteredExercises!.map(renderListItem)}</ul>
          )
        ) : (
          <div className="mt-4 space-y-8">
            {librarySections.map(({ muscle, items }) => (
              <section key={muscle}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gymsanity-500">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </h3>
                <ul className="mt-3 space-y-3">{items.map(renderListItem)}</ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
