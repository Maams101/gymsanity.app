"use client";

import { ExerciseDemoModal } from "@/components/ExerciseDemoModal";
import { SessionRestTimer } from "@/components/SessionRestTimer";
import type { RestTimerState } from "@/lib/use-rest-countdown";
import {
  displayKgToInputString,
  tryParseLoadInputToKg,
  type LoadWeightUnit,
} from "@/lib/load-weight-display";
import { kgToLbs, lbsToKg, roundWeightDisplay } from "@/lib/units";
import { parseRestSeconds, parseTargetReps } from "@/lib/workout-prescription-parse";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const REST_STORAGE_KEY = "gymsanity-default-rest-sec";
const DEFAULT_REST_SEC = 90;

type DraftMap = Record<string, Record<number, { w: string; r: string }>>;
type RepCountMap = Record<string, Record<number, number>>;

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

function buildRepCounts(
  lines: TrackerLine[],
  initialLoad: Props["initialLoad"],
  completed: Record<string, Set<number>>,
): RepCountMap {
  const out: RepCountMap = {};
  for (const line of lines) {
    const maxSets = Math.min(20, Math.max(1, line.setCount));
    const target = parseTargetReps(line.prescription);
    out[line.id] = {};
    for (let i = 1; i <= maxSets; i++) {
      const saved = initialLoad?.[line.id]?.[i]?.reps;
      if (saved != null) out[line.id][i] = saved;
      else if (completed[line.id]?.has(i)) out[line.id][i] = 0;
      else out[line.id][i] = target ?? 0;
    }
  }
  return out;
}

function firstIncompleteSet(lineId: string, maxSets: number, done: Set<number>): number {
  for (let i = 1; i <= maxSets; i++) {
    if (!done.has(i)) return i;
  }
  return maxSets;
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

  const [defaultRestSec, setDefaultRestSec] = useState(DEFAULT_REST_SEC);

  const [completed, setCompleted] = useState<Record<string, Set<number>>>(() => {
    const m: Record<string, Set<number>> = {};
    for (const [lineId, indices] of Object.entries(initialCompleted)) {
      m[lineId] = new Set(indices);
    }
    return m;
  });
  const [loadDraft, setLoadDraft] = useState(() => buildDraftFromInitial(initialLoad, defaultWeightUnit));
  const [repCounts, setRepCounts] = useState<RepCountMap>(() =>
    buildRepCounts(lines, initialLoad, Object.fromEntries(
      Object.entries(initialCompleted).map(([k, v]) => [k, new Set(v)])
    ))
  );
  const [activeSet, setActiveSet] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const line of lines) {
      const maxSets = Math.min(20, Math.max(1, line.setCount));
      const done = new Set(initialCompleted[line.id] ?? []);
      m[line.id] = firstIncompleteSet(line.id, maxSets, done);
    }
    return m;
  });

  const [loading, setLoading] = useState<string | null>(null);
  const [loadSaving, setLoadSaving] = useState<string | null>(null);
  const [demo, setDemo] = useState<{ url: string; title: string } | null>(null);
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);

  const lineById = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "kg" || s === "lbs") {
        weightUnitRef.current = s;
        setWeightUnit(s);
        setLoadDraft(buildDraftFromInitial(initialLoad, s));
      }
      const restRaw = localStorage.getItem(REST_STORAGE_KEY);
      if (restRaw) {
        const n = Number(restRaw);
        if (Number.isFinite(n) && n >= 15 && n <= 600) setDefaultRestSec(n);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + hydrate from device only
  }, []);

  useEffect(() => {
    setLoadDraft(buildDraftFromInitial(initialLoad, weightUnitRef.current));
    setRepCounts(
      buildRepCounts(
        lines,
        initialLoad,
        Object.fromEntries(Object.entries(initialCompleted).map(([k, v]) => [k, new Set(v)]))
      )
    );
  }, [initialLoadKey, lines, initialCompleted]);

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

  const startRest = useCallback(
    (line: TrackerLine, setIndex: number) => {
      const sec = parseRestSeconds(line.prescription) ?? defaultRestSec;
      setRestTimer({
        endsAt: Date.now() + sec * 1000,
        totalSec: sec,
        label: `After ${line.name} · Set ${setIndex}`,
        lineId: line.id,
        setIndex,
      });
    },
    [defaultRestSec]
  );

  const clearRest = useCallback(() => setRestTimer(null), []);

  const persistDefaultRest = useCallback((sec: number) => {
    setDefaultRestSec(sec);
    try {
      localStorage.setItem(REST_STORAGE_KEY, String(sec));
    } catch {
      /* ignore */
    }
  }, []);

  const addRestSeconds = useCallback((delta: number) => {
    setRestTimer((t) =>
      t ? { ...t, endsAt: t.endsAt + delta * 1000, totalSec: t.totalSec + delta } : null
    );
  }, []);

  const restartRest = useCallback(
    (seconds: number) => {
      persistDefaultRest(seconds);
      setRestTimer((t) =>
        t
          ? {
              ...t,
              endsAt: Date.now() + seconds * 1000,
              totalSec: seconds,
            }
          : null
      );
    },
    [persistDefaultRest]
  );

  const commitLoad = useCallback(
    async (
      exerciseLineId: string,
      setIndex: number,
      opts?: { repsOverride?: number; startRest?: boolean }
    ) => {
      const line = lineById.get(exerciseLineId);
      if (!line) return false;

      const draft = loadDraft[exerciseLineId]?.[setIndex] ?? { w: "", r: "" };
      const wTrim = draft.w.trim();
      const rTrim =
        opts?.repsOverride != null ? String(opts.repsOverride) : draft.r.trim();

      const parsedW = tryParseLoadInputToKg(wTrim, weightUnit);
      if (!parsedW.ok && line.section === "STRENGTH" && wTrim !== "") return false;

      let repsNum: number | null = null;
      if (rTrim !== "") {
        repsNum = Number(rTrim);
        if (Number.isNaN(repsNum) || !Number.isInteger(repsNum) || repsNum < 0) return false;
      } else if (opts?.repsOverride != null) {
        repsNum = opts.repsOverride;
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
          weightKg: parsedW.ok ? parsedW.kg : null,
          reps: repsNum,
        }),
      });
      setLoadSaving(null);
      if (!res.ok) return false;

      setCompleted((prev) => {
        const next = { ...prev };
        const s = new Set(next[exerciseLineId] ?? []);
        s.add(setIndex);
        next[exerciseLineId] = s;
        return next;
      });
      setLoadDraft((prev) => ({
        ...prev,
        [exerciseLineId]: {
          ...prev[exerciseLineId],
          [setIndex]: {
            w: draft.w,
            r: repsNum != null ? String(repsNum) : draft.r,
          },
        },
      }));

      const maxSets = Math.min(20, Math.max(1, line.setCount));
      setActiveSet((prev) => {
        const doneAfter = new Set(completed[exerciseLineId] ?? []);
        doneAfter.add(setIndex);
        return {
          ...prev,
          [exerciseLineId]: firstIncompleteSet(exerciseLineId, maxSets, doneAfter),
        };
      });

      if (opts?.startRest !== false) startRest(line, setIndex);
      router.refresh();
      return true;
    },
    [completed, lineById, loadDraft, router, startRest, weightUnit]
  );

  const uncompleteSet = useCallback(
    async (exerciseLineId: string, setIndex: number) => {
      const key = `${exerciseLineId}-${setIndex}`;
      setLoading(key);
      const res = await fetch("/api/workouts/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseLineId, setIndex, done: false }),
      });
      setLoading(null);
      if (!res.ok) return;
      setCompleted((prev) => {
        const next = { ...prev };
        const s = new Set(next[exerciseLineId] ?? []);
        s.delete(setIndex);
        next[exerciseLineId] = s;
        return next;
      });
      setActiveSet((prev) => ({ ...prev, [exerciseLineId]: setIndex }));
      router.refresh();
    },
    [router]
  );

  const adjustReps = useCallback((lineId: string, setIndex: number, delta: number) => {
    setRepCounts((prev) => {
      const current = prev[lineId]?.[setIndex] ?? 0;
      const nextVal = Math.max(0, Math.min(2000, current + delta));
      setLoadDraft((draftPrev) => {
        const draft = draftPrev[lineId]?.[setIndex] ?? { w: "", r: "" };
        return {
          ...draftPrev,
          [lineId]: {
            ...draftPrev[lineId],
            [setIndex]: { ...draft, r: String(nextVal) },
          },
        };
      });
      return {
        ...prev,
        [lineId]: { ...prev[lineId], [setIndex]: nextVal },
      };
    });
  }, []);

  const completeActiveSet = useCallback(
    async (line: TrackerLine, setNum: number) => {
      const key = `${line.id}-${setNum}`;
      setLoading(key);
      const reps = repCounts[line.id]?.[setNum] ?? 0;
      await commitLoad(line.id, setNum, { repsOverride: reps, startRest: true });
      setLoading(null);
    },
    [commitLoad, repCounts]
  );

  const prep = lines.filter((l) => l.section === "MOVEMENT_PREP");
  const strength = lines.filter((l) => l.section === "STRENGTH");

  function renderSetControls(ex: TrackerLine, maxSets: number, doneForLine: Set<number>, showLoads: boolean) {
    const current = activeSet[ex.id] ?? 1;
    const draft = loadDraft[ex.id]?.[current] ?? { w: "", r: "" };
    const reps = repCounts[ex.id]?.[current] ?? 0;
    const busy = loading === `${ex.id}-${current}` || loadSaving === `load-${ex.id}-${current}`;
    const wLabel = weightUnit === "lbs" ? "lbs" : "kg";
    const targetReps = parseTargetReps(ex.prescription);
    const restHint = parseRestSeconds(ex.prescription) ?? defaultRestSec;

    if (doneForLine.has(current)) return null;

    if (restTimer?.lineId === ex.id) {
      return (
        <div className="mt-3">
          <SessionRestTimer
            variant="inline"
            timer={restTimer}
            onSkip={clearRest}
            onAddSeconds={addRestSeconds}
            onRestart={restartRest}
            onComplete={() => undefined}
          />
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-xl border border-gymsanity-200 bg-gymsanity-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
          Set {current} · count reps
          {targetReps != null ? ` (target ~${targetReps})` : ""}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Decrease reps"
            disabled={busy}
            onClick={() => adjustReps(ex.id, current, -1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gymsanity-300 bg-white text-xl font-semibold text-gymsanity-900 hover:bg-gymsanity-100 disabled:opacity-50"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center font-display text-4xl font-semibold tabular-nums text-gymsanity-950">
            {reps}
          </span>
          <button
            type="button"
            aria-label="Increase reps"
            disabled={busy}
            onClick={() => adjustReps(ex.id, current, 1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gymsanity-300 bg-white text-xl font-semibold text-gymsanity-900 hover:bg-gymsanity-100 disabled:opacity-50"
          >
            +
          </button>
        </div>

        {showLoads ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-gymsanity-600">{wLabel}</span>
              <input
                type="text"
                inputMode="decimal"
                disabled={busy}
                value={draft.w}
                onChange={(e) =>
                  setLoadDraft((prev) => ({
                    ...prev,
                    [ex.id]: {
                      ...prev[ex.id],
                      [current]: { ...draft, w: e.target.value },
                    },
                  }))
                }
                className="w-24 rounded-lg border border-gymsanity-200 bg-white px-2 py-1.5 text-sm"
                placeholder="—"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void completeActiveSet(ex, current)}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Complete set"}
          </button>
          <span className="text-xs text-gymsanity-600">Rest ~{restHint}s after</span>
        </div>
      </div>
    );
  }

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
            const current = activeSet[ex.id] ?? 1;
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
                      const isActive = !isDone && setNum === current;
                      const busy = loading === `${ex.id}-${setNum}`;
                      const savedReps = loadDraft[ex.id]?.[setNum]?.r;
                      return (
                        <button
                          key={setNum}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (isDone) void uncompleteSet(ex.id, setNum);
                            else setActiveSet((prev) => ({ ...prev, [ex.id]: setNum }));
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            isDone
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : isActive
                                ? "border-2 border-gymsanity-600 bg-gymsanity-50 text-gymsanity-950 ring-2 ring-gymsanity-200"
                                : "border border-gymsanity-300 bg-white text-gymsanity-900 hover:border-gymsanity-500"
                          }`}
                        >
                          {busy
                            ? "…"
                            : isDone
                              ? `Set ${setNum}${savedReps ? ` · ${savedReps}` : " ✓"}`
                              : `Set ${setNum}`}
                        </button>
                      );
                    })}
                  </div>

                  {renderSetControls(ex, maxSets, doneForLine, showLoads)}

                  {showLoads
                    ? Array.from({ length: maxSets }, (_, j) => {
                        const setNum = j + 1;
                        if (!doneForLine.has(setNum) || setNum === current) return null;
                        const draft = loadDraft[ex.id]?.[setNum] ?? { w: "", r: "" };
                        const saveBusy = loadSaving === `load-${ex.id}-${setNum}`;
                        const wLabel = weightUnit === "lbs" ? "lbs" : "kg";
                        return (
                          <div key={setNum} className="mt-3 flex flex-wrap items-end gap-2">
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
                                onBlur={() => void commitLoad(ex.id, setNum, { startRest: false })}
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
                                onBlur={() => void commitLoad(ex.id, setNum, { startRest: false })}
                                className="w-16 rounded-lg border border-gymsanity-200 bg-white px-2 py-1 text-sm"
                                placeholder="—"
                              />
                            </label>
                            {saveBusy ? (
                              <span className="text-xs text-gymsanity-600">Saving…</span>
                            ) : null}
                          </div>
                        );
                      })
                    : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className={`space-y-10 ${restTimer ? "pb-44" : ""}`}>
      <ExerciseDemoModal
        open={demo != null}
        title={demo?.title ?? ""}
        videoUrl={demo?.url ?? ""}
        onClose={() => setDemo(null)}
      />
      {strength.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gymsanity-200 bg-white px-4 py-3">
          <p className="text-sm text-gymsanity-800">
            Use the rep counter during each set. A{" "}
            <span className="font-medium text-gymsanity-950">recovery countdown</span> starts automatically
            when you complete a set. Log strength loads in{" "}
            <span className="font-medium text-gymsanity-950">kg</span> or{" "}
            <span className="font-medium text-gymsanity-950">lbs</span>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gymsanity-900">
              Default rest
              <select
                value={defaultRestSec}
                onChange={(e) => persistDefaultRest(Number(e.target.value))}
                className="rounded-lg border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
              >
                <option value={60}>60s</option>
                <option value={90}>90s</option>
                <option value={120}>2:00</option>
                <option value={180}>3:00</option>
              </select>
            </label>
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
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gymsanity-200 bg-white px-4 py-3">
          <p className="text-sm text-gymsanity-800">
            Count reps with +/− during each set. A{" "}
            <span className="font-medium text-gymsanity-950">recovery countdown</span> starts when you tap{" "}
            <span className="font-medium text-gymsanity-950">Complete set</span>.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-gymsanity-900">
            Default rest
            <select
              value={defaultRestSec}
              onChange={(e) => persistDefaultRest(Number(e.target.value))}
              className="rounded-lg border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
            >
              <option value={60}>60s</option>
              <option value={90}>90s</option>
              <option value={120}>2:00</option>
              <option value={180}>3:00</option>
            </select>
          </label>
        </div>
      )}
      {renderBlock(SECTION_LABEL.MOVEMENT_PREP, prep)}
      {renderBlock(SECTION_LABEL.STRENGTH, strength)}

      <SessionRestTimer
        timer={restTimer}
        onSkip={clearRest}
        onAddSeconds={addRestSeconds}
        onRestart={restartRest}
        onComplete={() => undefined}
      />
    </div>
  );
}
