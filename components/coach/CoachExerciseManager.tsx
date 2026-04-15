"use client";

import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS_ORDER,
  parseMuscleGroup,
  type MuscleGroup,
} from "@/lib/muscle-groups";
import { useEffect, useMemo, useState } from "react";

type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string | null;
  cues: string;
  published: boolean;
};

export function CoachExerciseManager() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("full_body");
  const [libraryMuscleFilter, setLibraryMuscleFilter] = useState<"" | MuscleGroup>("");
  const [cues, setCues] = useState("");
  const [equipment, setEquipment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/coach/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        muscleGroup,
        cues,
        equipment: equipment || undefined,
        videoUrl: videoUrl || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    setName("");
    setCues("");
    setEquipment("");
    setVideoUrl("");
    await load();
  }

  const librarySections = useMemo(() => {
    const byMuscle = new Map<MuscleGroup, Exercise[]>();
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
    await load();
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={create}
        className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"
      >
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Add exercise</h2>
        <p className="mt-1 text-sm text-gymsanity-800/80">
          Movements you can reuse when building programs—name, primary muscle group, cues, optional demo
          link.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-gymsanity-900">
            Name *
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            />
          </label>
          <label className="block text-sm font-medium text-gymsanity-900">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
          <label className="block text-sm font-medium text-gymsanity-900">
            Muscle group
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
            >
              {MUSCLE_GROUPS_ORDER.map((mg) => (
                <option key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm font-medium text-gymsanity-900">
          Coaching cues *
          <textarea
            required
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            placeholder="Ribs down, knees track, breathe out on the effort…"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-gymsanity-900">
          Equipment (optional)
          <input
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-gymsanity-900">
          Demo video URL (optional)
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            placeholder="https://youtube.com/… or Vimeo, or direct .mp4 link"
          />
          <span className="mt-1 block text-xs text-gymsanity-700/85">
            Members tap <span className="font-medium text-gymsanity-900">Watch demo clip</span> in a session to
            play it in the app (YouTube, Vimeo, or direct video file).
          </span>
        </label>
        <button
          type="submit"
          className="mt-4 rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
        >
          Save to library
        </button>
      </form>

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
            <ul className="mt-4 space-y-3">
              {filteredExercises!.map((ex) => (
                <li
                  key={ex.id}
                  className="flex flex-col gap-2 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
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
                  <button
                    type="button"
                    onClick={() => void remove(ex.id)}
                    className="shrink-0 text-sm font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="mt-4 space-y-8">
            {librarySections.map(({ muscle, items }) => (
              <section key={muscle}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gymsanity-500">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </h3>
                <ul className="mt-3 space-y-3">
                  {items.map((ex) => (
                    <li
                      key={ex.id}
                      className="flex flex-col gap-2 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gymsanity-950">{ex.name}</p>
                        <p className="text-xs uppercase tracking-wide text-gymsanity-600">{ex.category}</p>
                        <p className="mt-2 text-sm text-gymsanity-900/80">{ex.cues}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(ex.id)}
                        className="shrink-0 text-sm font-semibold text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
