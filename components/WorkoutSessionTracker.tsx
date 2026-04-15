"use client";

import { ExerciseDemoModal } from "@/components/ExerciseDemoModal";
import {
  displayKgToInputString,
  tryParseLoadInputToKg,
  type LoadWeightUnit,
} from "@/lib/load-weight-display";
import { kgToLbs, lbsToKg, roundWeightDisplay } from "@/lib/units";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type TrackerLine = {
  id: string;
  name: string;
  prescription: string;
  section: "MOVEMENT_PREP" | "STRENGTH";
  setCount: number;
  cues: string | null;
  videoUrl: string | null;
};

export type InitialSetLoad = {
  weightKg: number | null;
  reps: number | null;
};

type Props = {
  lines: TrackerLine[];
  initialCompleted: Record<string, number[]>;
  initialLoad?: Record<string, Partial<Record<number, InitialSetLoad>>>;
  /** From onboarding; member can override for this app via the selector + localStorage. */
  defaultWeightUnit: LoadWeightUnit;
};

const SECTION_LABEL: Record<TrackerLine["section"], string> = {
  MOVEMENT_PREP: "Movement prep",
  STRENGTH: "Strength",
};

const STORAGE_KEY = "gymsanity-load-weight-unit";

type DraftMap = Record<string, Record<number, { w: string; r: string }>>;

function buildDraftFromInitial(
  initialLoad: Props["initialLoad"],
  unit: LoadWeightUnit,
): DraftMap {
  const out: DraftMap = {};
  if (!initialLoad) return out;
  for (const [lineId, sets] of Object.entries(initialLoad)) {
    out[lineId] = {};
    for (const [idxStr, v] of Object.entries(sets)) {
      const idx = Number(idxStr);
      if (!v) continue;
      out[lineId][idx] = {
        w: displayKgToInputString(v.weightKg, unit),
        r: v.reps != null ? String(v.reps) : "",
      };
    }
  }
  return out;
}

function convertDraftUnit(draft: DraftMap, from: LoadWeightUnit, to: LoadWeightUnit): DraftMap {
  if (from === to) return draft;
  const next: DraftMap = { ...draft };
  for (const lineId of Object.keys(next)) {
    const lineEntries = { ...next[lineId] };
    for (const setIdxStr of Object.keys(lineEntries)) {
      const setIdx = Number(setIdxStr);
      const cell = lineEntries[setIdx];
      const w = cell.w.trim();
      if (w === "") continue;
      const n = Number(w);
      if (Number.isNaN(n)) continue;
      const kg = from === "kg" ? n : lbsToKg(n);
      const outW = to === "kg" ? String(roundWeightDisplay(kg)) : String(roundWeightDisplay(kgToLbs(kg)));
      lineEntries[setIdx] = { ...cell, w: outW };
    }
    next[lineId] = lineEntries;
  }
  return next;
}

export function WorkoutSessionTracker({
  lines,
  initialCompleted,
  initialLoad,
  defaultWeightUnit,
}: Props) {
  const router = useRouter();
  const initialLoadKey = JSON.stringify(initialLoad ?? {});

  const [weightUnit, setWeightUnit] = useState<LoadWeightUnit>(defaultWeightUnit);
  const weightUnitRef = useRef(weightUnit);
  weightUnitRef.current = weightUnit;

  const [completed, setCompleted] = useState<Record<string, Set<number>>>(() => {
    const m: Record<string, Set<number>> = {};
    for (const [lineId, indices] of Object.entries(initialCompleted)) {
      m[lineId] = new Set(indices);
    }
    return m;
  });
  const [loadDraft, setLoadDraft] = useState(() => buildDraftFromInitial(initialLoad, defaultWeightUnit));
  const [loading, setLoading] = useState<string | null>(null);
  const [loadSaving, setLoadSaving] = useState<string | null>(null);
  const [demo, setDemo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "kg" || s === "lbs") {
        weightUnitRef.current = s;
        setWeightUnit(s);
        setLoadDraft(buildDraftFromInitial(initialLoad, s));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + hydrate unit from device only
  }, []);

  useEffect(() => {
    setLoadDraft(buildDraftFromInitial(initialLoad, weightUnitRef.current));
  }, [initialLoadKey]);

  const setWeightUnitAndPersist = useCallback((next: LoadWeightUnit) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLoadDraft((d) => convertDraftUnit(d, weightUnitRef.current, next));
    weightUnitRef.current = next;
    setWeightUnit(next);
  }, []);

  const toggleSet = useCallback(
    async (exerciseLineId: string, setIndex: number, maxSets: number, nextDone: boolean) => {
      const key = `${exerciseLineId}-${setIndex}`;
      setLoading(key);
      const res = await fetch("/api/workouts/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseLineId, setIndex, done: nextDone }),
      });
      setLoading(null);
      if (!res.ok) return;
      setCompleted((prev) => {
        const next = { ...prev };
        const s = new Set(next[exerciseLineId] ?? []);
        if (nextDone) s.add(setIndex);
        else s.delete(setIndex);
        next[exerciseLineId] = s;
        return next;
      });
      if (nextDone) {
        setLoadDraft((prev) => ({
          ...prev,
          [exerciseLineId]: {
            ...prev[exerciseLineId],
            [setIndex]: prev[exerciseLineId]?.[setIndex] ?? { w: "", r: "" },
          },
        }));
      }
      router.refresh();
    },
    [router]
  );

  const commitLoad = useCallback(
    async (exerciseLineId: string, setIndex: number) => {
      if (!(completed[exerciseLineId]?.has(setIndex))) return;
      const draft = loadDraft[exerciseLineId]?.[setIndex] ?? { w: "", r: "" };
      const wTrim = draft.w.trim();
      const rTrim = draft.r.trim();

      const parsedW = tryParseLoadInputToKg(wTrim, weightUnit);
      if (!parsedW.ok) return;

      let repsNum: number | null = null;
      if (rTrim !== "") {
        repsNum = Number(rTrim);
        if (Number.isNaN(repsNum) || !Number.isInteger(repsNum) || repsNum < 0) return;
      }

      const key = `load-${exerciseLineId}-${setIndex}`;
      setLoadSaving(key);
      const res = await fetch("/api/workouts/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseLineId,
          setIndex,
          done: true,
          weightKg: parsedW.kg,
          reps: repsNum,
        }),
      });
      setLoadSaving(null);
      if (!res.ok) return;
      router.refresh();
    },
    [completed, loadDraft, router, weightUnit]
  );

  const prep = lines.filter((l) => l.section === "MOVEMENT_PREP");
  const strength = lines.filter((l) => l.section === "STRENGTH");

  function renderBlock(title: string, blockLines: TrackerLine[]) {
    if (blockLines.length === 0) return null;
    return (
      <div className="space-y-6">
        <h3 className="border-b border-gymsanity-200 pb-2 font-display text-lg font-semibold text-gymsanity-950">
          {title}
        </h3>
        <ol className="space-y-6">
          {blockLines.map((ex, i) => {
            const maxSets = Math.min(20, Math.max(1, ex.setCount));
            const doneForLine = completed[ex.id] ?? new Set<number>();
            const showLoads = ex.section === "STRENGTH";
            return (
              <li key={ex.id} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gymsanity-100 text-xs font-bold text-gymsanity-900">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gymsanity-950">{ex.name}</p>
                  <p className="text-sm text-gymsanity-900/75">{ex.prescription}</p>
                  {ex.cues ? (
                    <p className="mt-2 border-l-2 border-gymsanity-300 pl-3 text-sm italic text-gymsanity-800/90">
                      {ex.cues}
                    </p>
                  ) : null}
                  {ex.videoUrl ? (
                    <button
                      type="button"
                      onClick={() => setDemo({ url: ex.videoUrl!, title: ex.name })}
                      className="mt-2 text-left text-sm font-semibold text-gymsanity-700 underline decoration-gymsanity-300 underline-offset-2 hover:text-gymsanity-950"
                    >
                      Watch demo clip
                    </button>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: maxSets }, (_, j) => {
                      const setNum = j + 1;
                      const isDone = doneForLine.has(setNum);
                      const busy = loading === `${ex.id}-${setNum}`;
                      return (
                        <button
                          key={setNum}
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleSet(ex.id, setNum, maxSets, !isDone)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            isDone
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border border-gymsanity-300 bg-white text-gymsanity-900 hover:border-gymsanity-500"
                          }`}
                        >
                          {busy ? "…" : `Set ${setNum}`}
                        </button>
                      );
                    })}
                  </div>
                  {showLoads ? (
                    <div className="mt-3 space-y-2">
                      {Array.from({ length: maxSets }, (_, j) => {
                        const setNum = j + 1;
                        if (!doneForLine.has(setNum)) return null;
                        const draft = loadDraft[ex.id]?.[setNum] ?? { w: "", r: "" };
                        const saveBusy = loadSaving === `load-${ex.id}-${setNum}`;
                        const wLabel = weightUnit === "lbs" ? "lbs" : "kg";
                        return (
                          <div
                            key={setNum}
                            className="flex flex-wrap items-end gap-2"
                          >
                            <span className="text-xs font-medium text-gymsanity-700">Set {setNum}</span>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wide text-gymsanity-600">
                                {wLabel}
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={saveBusy}
                                value={draft.w}
                                onChange={(e) =>
                                  setLoadDraft((prev) => ({
                                    ...prev,
                                    [ex.id]: {
                                      ...prev[ex.id],
                                      [setNum]: { ...draft, w: e.target.value },
                                    },
                                  }))
                                }
                                onBlur={() => void commitLoad(ex.id, setNum)}
                                className="w-20 rounded-lg border border-gymsanity-200 bg-white px-2 py-1 text-sm"
                                placeholder="—"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wide text-gymsanity-600">Reps</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                disabled={saveBusy}
                                value={draft.r}
                                onChange={(e) =>
                                  setLoadDraft((prev) => ({
                                    ...prev,
                                    [ex.id]: {
                                      ...prev[ex.id],
                                      [setNum]: { ...draft, r: e.target.value },
                                    },
                                  }))
                                }
                                onBlur={() => void commitLoad(ex.id, setNum)}
                                className="w-16 rounded-lg border border-gymsanity-200 bg-white px-2 py-1 text-sm"
                                placeholder="—"
                              />
                            </label>
                            {saveBusy ? (
                              <span className="text-xs text-gymsanity-600">Saving…</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ExerciseDemoModal
        open={demo != null}
        title={demo?.title ?? ""}
        videoUrl={demo?.url ?? ""}
        onClose={() => setDemo(null)}
      />
      {strength.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gymsanity-200 bg-white px-4 py-3">
          <p className="text-sm text-gymsanity-800">
            Log strength loads in <span className="font-medium text-gymsanity-950">kg</span> or{" "}
            <span className="font-medium text-gymsanity-950">lbs</span>—we save in kg behind the scenes.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-gymsanity-900">
            Weight unit
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnitAndPersist(e.target.value as LoadWeightUnit)}
              className="rounded-lg border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </label>
        </div>
      ) : null}
      {renderBlock(SECTION_LABEL.MOVEMENT_PREP, prep)}
      {renderBlock(SECTION_LABEL.STRENGTH, strength)}
    </div>
  );
}
