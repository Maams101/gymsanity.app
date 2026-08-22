"use client";

import Link from "next/link";
import {
  groupLinesForDisplay,
  pairFlowHint,
  pairLetter,
  pairTypeLabel,
  type ExercisePairType,
} from "@/lib/exercise-pairing";
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS_ORDER,
  parseMuscleGroup,
  type MuscleGroup,
} from "@/lib/muscle-groups";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExerciseForm, type ExerciseRecord } from "@/components/coach/ExerciseForm";

type Ex = ExerciseRecord;
type LineSection = "MOVEMENT_PREP" | "STRENGTH" | "COOLDOWN";
type Line = {
  id: string;
  name: string;
  prescription: string;
  exerciseId: string | null;
  section: LineSection;
  setCount: number;
  pairGroupId: string | null;
  pairType: ExercisePairType | null;
  pairOrder: number | null;
};
type Day = {
  id: string;
  weekNumber: number;
  dayIndex: number;
  title: string;
  focusNote: string | null;
  exercises: Line[];
};
type Program = {
  id: string;
  title: string;
  description: string;
  weeks: number;
  published: boolean;
  assignedMemberId: string | null;
  assignedMember?: { id: string; name: string; email: string } | null;
  days: Day[];
};

type MemberOption = { id: string; name: string; email: string };

const MIN_SETS = 1;
const MAX_SETS = 20;
const SETS_RANGE_MSG = `Whole number from ${MIN_SETS} to ${MAX_SETS}.`;

const SECTION_KEYS: LineSection[] = ["MOVEMENT_PREP", "STRENGTH", "COOLDOWN"];

type DragBlockPayload = {
  dayId: string;
  fromSection: LineSection;
  blockKey: string;
  lineIds: string[];
};

const DRAG_MIME = "application/x-gymsanity-block";

function blockKeyFromDisplay(
  block: ReturnType<typeof groupLinesForDisplay<Line>>[number]
): string {
  return block.kind === "single" ? `line:${block.line.id}` : `group:${block.groupId}`;
}

function lineIdsFromDisplay(
  block: ReturnType<typeof groupLinesForDisplay<Line>>[number]
): string[] {
  return block.kind === "single" ? [block.line.id] : block.lines.map((l) => l.id);
}

function sectionsLayoutFromLines(lines: Line[]): Record<LineSection, string[]> {
  const layout: Record<LineSection, string[]> = {
    MOVEMENT_PREP: [],
    STRENGTH: [],
    COOLDOWN: [],
  };
  for (const section of SECTION_KEYS) {
    const sectionLines = lines.filter((l) => l.section === section);
    for (const block of groupLinesForDisplay(sectionLines)) {
      layout[section].push(...lineIdsFromDisplay(block));
    }
  }
  return layout;
}

/** Move a display block (single or pair group) within/across sections. `toBlockIndex` is the
 *  insertion index in the target section's block list *after* the source block is removed. */
function moveBlockInLayout(
  dayLines: Line[],
  fromSection: LineSection,
  toSection: LineSection,
  lineIds: string[],
  toBlockIndex: number
): Record<LineSection, string[]> {
  const movingSet = new Set(lineIds);
  const blocksBySection: Record<
    LineSection,
    ReturnType<typeof groupLinesForDisplay<Line>>
  > = {
    MOVEMENT_PREP: groupLinesForDisplay(dayLines.filter((l) => l.section === "MOVEMENT_PREP")),
    STRENGTH: groupLinesForDisplay(dayLines.filter((l) => l.section === "STRENGTH")),
    COOLDOWN: groupLinesForDisplay(dayLines.filter((l) => l.section === "COOLDOWN")),
  };

  const fromBlocks = blocksBySection[fromSection];
  const fromIdx = fromBlocks.findIndex((b) =>
    lineIdsFromDisplay(b).some((id) => movingSet.has(id))
  );
  if (fromIdx < 0) return sectionsLayoutFromLines(dayLines);

  const [moved] = fromBlocks.splice(fromIdx, 1);
  if (!moved) return sectionsLayoutFromLines(dayLines);

  const insertAt = Math.max(0, Math.min(toBlockIndex, blocksBySection[toSection].length));
  blocksBySection[toSection].splice(insertAt, 0, moved);

  return {
    MOVEMENT_PREP: blocksBySection.MOVEMENT_PREP.flatMap(lineIdsFromDisplay),
    STRENGTH: blocksBySection.STRENGTH.flatMap(lineIdsFromDisplay),
    COOLDOWN: blocksBySection.COOLDOWN.flatMap(lineIdsFromDisplay),
  };
}

function DragHandle({ label }: { label: string }) {
  return (
    <span
      className="mt-0.5 inline-flex cursor-grab touch-none select-none items-center rounded-md border border-gymsanity-200 bg-white px-1.5 py-1 text-gymsanity-500 active:cursor-grabbing"
      title={label}
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="3" cy="2.5" r="1.1" />
        <circle cx="9" cy="2.5" r="1.1" />
        <circle cx="3" cy="6" r="1.1" />
        <circle cx="9" cy="6" r="1.1" />
        <circle cx="3" cy="9.5" r="1.1" />
        <circle cx="9" cy="9.5" r="1.1" />
      </svg>
    </span>
  );
}

function parseSetsWholeNumber(raw: string): { ok: true; value: number } | { ok: false } {
  const t = raw.trim();
  if (t === "") return { ok: false };
  const n = Number(t);
  if (!Number.isInteger(n) || n < MIN_SETS || n > MAX_SETS) return { ok: false };
  return { ok: true, value: n };
}

function LineSetCountEditor({
  lineId,
  setCount,
  busy,
  onCommit,
}: {
  lineId: string;
  setCount: number;
  busy: boolean;
  onCommit: (n: number) => void;
}) {
  const [value, setValue] = useState(String(setCount));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(setCount));
    setError(null);
  }, [lineId, setCount]);

  function validateAndCommit() {
    const parsed = parseSetsWholeNumber(value);
    if (!parsed.ok) {
      setError(SETS_RANGE_MSG);
      setValue(String(setCount));
      return;
    }
    setError(null);
    setValue(String(parsed.value));
    if (parsed.value !== setCount) onCommit(parsed.value);
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <label className="flex items-center gap-1 text-xs text-gymsanity-800">
        Sets
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          disabled={busy}
          onChange={(e) => {
            setError(null);
            setValue(e.target.value);
          }}
          onBlur={() => validateAndCommit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `sets-err-${lineId}` : undefined}
          className={`w-14 rounded-lg border bg-white px-2 py-1 text-xs ${
            error ? "border-red-400 ring-1 ring-red-200" : "border-gymsanity-200"
          }`}
        />
      </label>
      {error && (
        <p id={`sets-err-${lineId}`} className="max-w-[12rem] text-[10px] leading-tight text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProgramBuilder({
  program: initial,
  exercises: exercisesProp,
  members = [],
}: {
  program: Program;
  exercises: Ex[];
  members?: MemberOption[];
}) {
  const router = useRouter();
  const [program, setProgram] = useState(initial);
  const [exercises, setExercises] = useState<Ex[]>(exercisesProp);
  const [assignTo, setAssignTo] = useState<string>(initial.assignedMemberId ?? "");
  const [week, setWeek] = useState(1);
  const [dayIdx, setDayIdx] = useState(1);
  const [dayTitle, setDayTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [linePrescription, setLinePrescription] = useState<Record<string, string>>({});
  const [pickExercise, setPickExercise] = useState<Record<string, string>>({});
  const [lineSection, setLineSection] = useState<Record<string, LineSection>>({});
  const [addSetsDraft, setAddSetsDraft] = useState<Record<string, string>>({});
  const [addSetsError, setAddSetsError] = useState<Record<string, string | null>>({});
  const [selectedLines, setSelectedLines] = useState<Record<string, Set<string>>>({});
  const [muscleFilter, setMuscleFilter] = useState<Record<string, "" | MuscleGroup>>({});
  const [exercisePanel, setExercisePanel] = useState<
    Record<string, { mode: "create" } | { mode: "edit"; exerciseId: string } | undefined>
  >({});
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    initial.days[0]?.id ?? null
  );
  const [showAddDay, setShowAddDay] = useState(initial.days.length === 0);
  const [editTitle, setEditTitle] = useState(initial.title);
  const [editDescription, setEditDescription] = useState(initial.description);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editDayTitle, setEditDayTitle] = useState(initial.days[0]?.title ?? "");
  const [editDayFocus, setEditDayFocus] = useState(initial.days[0]?.focusNote ?? "");
  const [dayDetailsError, setDayDetailsError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragBlockPayload | null>(null);
  const [dropHint, setDropHint] = useState<{
    dayId: string;
    section: LineSection;
    blockIndex: number;
  } | null>(null);

  const sortedDays = useMemo(
    () =>
      [...program.days].sort(
        (a, b) => a.weekNumber - b.weekNumber || a.dayIndex - b.dayIndex
      ),
    [program.days]
  );

  const weeksGrouped = useMemo(() => {
    const map = new Map<number, Day[]>();
    for (const d of sortedDays) {
      const list = map.get(d.weekNumber) ?? [];
      list.push(d);
      map.set(d.weekNumber, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [sortedDays]);

  const selectedDay = sortedDays.find((d) => d.id === selectedDayId) ?? null;
  const selectedDaySyncId = selectedDay?.id ?? null;
  const selectedDaySyncTitle = selectedDay?.title ?? "";
  const selectedDaySyncFocus = selectedDay?.focusNote ?? "";

  const exercisesByMuscleGroup = useMemo(() => {
    const map = new Map<MuscleGroup, Ex[]>();
    for (const mg of MUSCLE_GROUPS_ORDER) map.set(mg, []);
    for (const ex of exercises) {
      const mg = parseMuscleGroup(ex.muscleGroup);
      map.get(mg)!.push(ex);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [exercises]);

  useEffect(() => {
    setAssignTo(program.assignedMemberId ?? "");
  }, [program.assignedMemberId]);

  useEffect(() => {
    setEditTitle(program.title);
    setEditDescription(program.description);
  }, [program.title, program.description]);

  useEffect(() => {
    if (sortedDays.length === 0) {
      setSelectedDayId(null);
      setShowAddDay(true);
      return;
    }
    if (!selectedDayId || !sortedDays.some((d) => d.id === selectedDayId)) {
      setSelectedDayId(sortedDays[0].id);
    }
  }, [sortedDays, selectedDayId]);

  useEffect(() => {
    if (!selectedDaySyncId) {
      setEditDayTitle("");
      setEditDayFocus("");
      setDayDetailsError(null);
      return;
    }
    setEditDayTitle(selectedDaySyncTitle);
    setEditDayFocus(selectedDaySyncFocus);
    setDayDetailsError(null);
  }, [selectedDaySyncId, selectedDaySyncTitle, selectedDaySyncFocus]);

  async function refresh() {
    const res = await fetch(`/api/coach/programs/${program.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setProgram(data.program);
    router.refresh();
  }

  async function addDay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/coach/program-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: program.id,
        weekNumber: week,
        dayIndex: dayIdx,
        title: dayTitle,
        focusNote: focus || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setDayTitle("");
    setFocus("");
    setShowAddDay(false);
    if (data.day?.id) setSelectedDayId(data.day.id);
    await refresh();
  }

  async function addLine(dayId: string) {
    const exId = pickExercise[dayId];
    const pres = linePrescription[dayId];
    if (!exId || !pres) return;
    const section = lineSection[dayId] ?? "STRENGTH";
    const parsedSets = parseSetsWholeNumber(addSetsDraft[dayId] ?? "3");
    if (!parsedSets.ok) {
      setAddSetsError((s) => ({ ...s, [dayId]: SETS_RANGE_MSG }));
      return;
    }
    const setCount = parsedSets.value;
    setAddSetsError((s) => ({ ...s, [dayId]: null }));
    setBusy(true);
    await fetch(`/api/coach/program-days/${dayId}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: exId, prescription: pres, section, setCount }),
    });
    setLinePrescription((s) => ({ ...s, [dayId]: "" }));
    setLineSection((s) => ({ ...s, [dayId]: "STRENGTH" }));
    setAddSetsDraft((s) => ({ ...s, [dayId]: "3" }));
    setBusy(false);
    await refresh();
  }

  async function patchLine(
    id: string,
    patch: Partial<{ section: LineSection; setCount: number }>
  ) {
    setBusy(true);
    await fetch(`/api/coach/exercise-lines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    await refresh();
  }

  async function deleteLine(id: string, dayId: string) {
    if (!confirm("Remove this line?")) return;
    await fetch(`/api/coach/exercise-lines/${id}`, { method: "DELETE" });
    setSelectedLines((s) => {
      const next = { ...s };
      next[dayId]?.delete(id);
      return next;
    });
    await refresh();
  }

  function toggleLineSelect(dayId: string, lineId: string) {
    setSelectedLines((prev) => {
      const set = new Set(prev[dayId] ?? []);
      if (set.has(lineId)) set.delete(lineId);
      else set.add(lineId);
      return { ...prev, [dayId]: set };
    });
  }

  async function pairSelected(dayId: string, pairType: ExercisePairType) {
    const ids = [...(selectedLines[dayId] ?? [])];
    if (ids.length < 2) return;
    setBusy(true);
    const res = await fetch("/api/coach/exercise-lines/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineIds: ids, pairType }),
    });
    setBusy(false);
    if (!res.ok) return;
    setSelectedLines((s) => ({ ...s, [dayId]: new Set() }));
    await refresh();
  }

  async function unpairSelected(dayId: string) {
    const ids = [...(selectedLines[dayId] ?? [])];
    if (ids.length === 0) return;
    setBusy(true);
    await fetch("/api/coach/exercise-lines/pair", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineIds: ids }),
    });
    setBusy(false);
    setSelectedLines((s) => ({ ...s, [dayId]: new Set() }));
    await refresh();
  }

  function exercisesForDay(dayId: string): Ex[] {
    return exercisesForDayWithFilter(muscleFilter[dayId] ?? "");
  }

  function setMuscleFilterForDay(dayId: string, value: "" | MuscleGroup) {
    setMuscleFilter((s) => ({ ...s, [dayId]: value }));
    setPickExercise((s) => {
      const current = s[dayId];
      if (!current) return s;
      const stillValid = exercisesForDayWithFilter(value).some((ex) => ex.id === current);
      if (stillValid) return s;
      return { ...s, [dayId]: "" };
    });
  }

  function exercisesForDayWithFilter(filter: "" | MuscleGroup): Ex[] {
    if (!filter) {
      return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
    }
    return exercisesByMuscleGroup.get(filter) ?? [];
  }

  function upsertLibraryExercise(exercise: ExerciseRecord, dayId: string) {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === exercise.id);
      if (idx === -1) return [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name));
      const next = [...prev];
      next[idx] = exercise;
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setPickExercise((s) => ({ ...s, [dayId]: exercise.id }));
    setMuscleFilterForDay(dayId, parseMuscleGroup(exercise.muscleGroup));
    setExercisePanel((s) => ({ ...s, [dayId]: undefined }));
  }

  function renderExercisePicker(dayId: string) {
    const filter = muscleFilter[dayId] ?? "";
    const options = exercisesForDay(dayId);
    const pickedId = pickExercise[dayId] ?? "";
    const pickedExercise = pickedId ? exercises.find((e) => e.id === pickedId) : null;
    const panel = exercisePanel[dayId];

    return (
      <div className="w-full space-y-3 sm:col-span-full">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm font-medium text-gymsanity-900 sm:min-w-[11rem]">
            Target muscle
            <select
              value={filter}
              onChange={(e) =>
                setMuscleFilterForDay(dayId, (e.target.value || "") as "" | MuscleGroup)
              }
              className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
            >
              <option value="">All groups</option>
              {MUSCLE_GROUPS_ORDER.map((mg) => {
                const count = exercisesByMuscleGroup.get(mg)?.length ?? 0;
                if (count === 0) return null;
                return (
                  <option key={mg} value={mg}>
                    {MUSCLE_GROUP_LABELS[mg]} ({count})
                  </option>
                );
              })}
            </select>
          </label>
          <label className="min-w-[12rem] flex-1 text-sm font-medium text-gymsanity-900">
            Exercise
            <select
              value={pickedId}
              onChange={(e) => {
                setPickExercise((s) => ({ ...s, [dayId]: e.target.value }));
                setExercisePanel((s) => ({ ...s, [dayId]: undefined }));
              }}
              disabled={filter !== "" && options.length === 0}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 disabled:opacity-60"
            >
              <option value="">
                {filter
                  ? options.length === 0
                    ? "No exercises for this muscle"
                    : `Select ${MUSCLE_GROUP_LABELS[filter].toLowerCase()} exercise…`
                  : "Select exercise…"}
              </option>
              {filter ? (
                options.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} · {ex.category}
                  </option>
                ))
              ) : (
                MUSCLE_GROUPS_ORDER.map((mg) => {
                  const list = exercisesByMuscleGroup.get(mg) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <optgroup key={mg} label={MUSCLE_GROUP_LABELS[mg]}>
                      {list.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} · {ex.category}
                        </option>
                      ))}
                    </optgroup>
                  );
                })
              )}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <button
              type="button"
              onClick={() =>
                setExercisePanel((s) => ({
                  ...s,
                  [dayId]: panel?.mode === "create" ? undefined : { mode: "create" },
                }))
              }
              className="rounded-full border border-gymsanity-200 bg-white px-3 py-2 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              {panel?.mode === "create" ? "Cancel" : "+ New exercise"}
            </button>
            {pickedExercise && (
              <button
                type="button"
                onClick={() =>
                  setExercisePanel((s) => ({
                    ...s,
                    [dayId]:
                      panel?.mode === "edit" ? undefined : { mode: "edit", exerciseId: pickedExercise.id },
                  }))
                }
                className="rounded-full border border-gymsanity-200 bg-white px-3 py-2 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
              >
                {panel?.mode === "edit" ? "Cancel edit" : "Edit exercise"}
              </button>
            )}
          </div>
        </div>

        {panel?.mode === "create" && (
          <div className="rounded-xl border border-gymsanity-200 bg-white p-4">
            <ExerciseForm
              mode="create"
              compact
              submitLabel="Save & select"
              onSuccess={(exercise) => upsertLibraryExercise(exercise, dayId)}
              onCancel={() => setExercisePanel((s) => ({ ...s, [dayId]: undefined }))}
            />
          </div>
        )}

        {panel?.mode === "edit" && pickedExercise && (
          <div className="rounded-xl border border-gymsanity-200 bg-white p-4">
            <ExerciseForm
              mode="edit"
              exerciseId={pickedExercise.id}
              initial={pickedExercise}
              compact
              submitLabel="Save changes"
              onSuccess={(exercise) => upsertLibraryExercise(exercise, dayId)}
              onCancel={() => setExercisePanel((s) => ({ ...s, [dayId]: undefined }))}
            />
          </div>
        )}
      </div>
    );
  }

  async function commitDayLayout(dayId: string, sections: Record<LineSection, string[]>) {
    const day = program.days.find((d) => d.id === dayId);
    if (!day) return;

    const byId = new Map(day.exercises.map((e) => [e.id, e]));
    const nextExercises: Line[] = [];
    for (const section of SECTION_KEYS) {
      for (const id of sections[section]) {
        const line = byId.get(id);
        if (line) nextExercises.push({ ...line, section });
      }
    }

    setProgram((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === dayId ? { ...d, exercises: nextExercises } : d)),
    }));

    setBusy(true);
    const res = await fetch(`/api/coach/program-days/${dayId}/lines/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections }),
    });
    setBusy(false);
    if (!res.ok) {
      await refresh();
      return;
    }
    await refresh();
  }

  function dropBlock(
    dayId: string,
    toSection: LineSection,
    toBlockIndex: number,
    payload: DragBlockPayload
  ) {
    if (payload.dayId !== dayId) return;
    const day = program.days.find((d) => d.id === dayId);
    if (!day) return;

    const fromBlocks = groupLinesForDisplay(
      day.exercises.filter((l) => l.section === payload.fromSection)
    );
    const fromIdx = fromBlocks.findIndex((b) => blockKeyFromDisplay(b) === payload.blockKey);
    if (fromIdx < 0) return;

    let insertAt = toBlockIndex;
    if (payload.fromSection === toSection) {
      if (fromIdx === toBlockIndex || fromIdx + 1 === toBlockIndex) return;
      if (fromIdx < toBlockIndex) insertAt = toBlockIndex - 1;
    }

    const sections = moveBlockInLayout(
      day.exercises,
      payload.fromSection,
      toSection,
      payload.lineIds,
      insertAt
    );
    void commitDayLayout(dayId, sections);
  }

  function onBlockDragStart(
    e: React.DragEvent,
    dayId: string,
    section: LineSection,
    block: ReturnType<typeof groupLinesForDisplay<Line>>[number]
  ) {
    const payload: DragBlockPayload = {
      dayId,
      fromSection: section,
      blockKey: blockKeyFromDisplay(block),
      lineIds: lineIdsFromDisplay(block),
    };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", payload.blockKey);
    setDragging(payload);
  }

  function parseDragPayload(e: React.DragEvent): DragBlockPayload | null {
    const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return dragging;
    try {
      if (raw.startsWith("{")) return JSON.parse(raw) as DragBlockPayload;
    } catch {
      /* ignore */
    }
    return dragging;
  }

  function renderLineRow(dayId: string, ln: Line, indexLabel: string) {
    const checked = selectedLines[dayId]?.has(ln.id) ?? false;
    return (
      <div
        key={ln.id}
        className="flex flex-col gap-2 rounded-xl border border-gymsanity-100 bg-gymsanity-50/40 p-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
          <div className="flex min-w-0 items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleLineSelect(dayId, ln.id)}
              className="mt-1 rounded text-gymsanity-700"
              aria-label={`Select ${ln.name}`}
            />
            <div className="min-w-0">
            <span className="font-medium text-gymsanity-950">
              {indexLabel}. {ln.name}
              {ln.pairOrder ? (
                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900">
                  {pairLetter(ln.pairOrder)}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-gymsanity-800/90">{ln.prescription}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
          <label className="flex items-center gap-1 text-xs text-gymsanity-800">
            Section
            <select
              value={ln.section}
              disabled={busy}
              onChange={(e) =>
                void patchLine(ln.id, {
                  section: e.target.value as LineSection,
                })
              }
              className="rounded-lg border border-gymsanity-200 bg-white px-2 py-1 text-xs"
            >
              <option value="MOVEMENT_PREP">Movement prep</option>
              <option value="STRENGTH">Strength</option>
              <option value="COOLDOWN">Cooldown</option>
            </select>
          </label>
          <LineSetCountEditor
            lineId={ln.id}
            setCount={ln.setCount}
            busy={busy}
            onCommit={(n) => void patchLine(ln.id, { setCount: n })}
          />
          <button
            type="button"
            onClick={() => void deleteLine(ln.id, dayId)}
            className="text-xs font-semibold text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  async function deleteDay(dayId: string) {
    if (!confirm("Delete this whole session day?")) return;
    const idx = sortedDays.findIndex((d) => d.id === dayId);
    await fetch(`/api/coach/program-days/${dayId}`, { method: "DELETE" });
    const next = sortedDays[idx + 1]?.id ?? sortedDays[idx - 1]?.id ?? null;
    setSelectedDayId(next);
    await refresh();
  }

  async function saveDayDetails(dayId: string) {
    const title = editDayTitle.trim();
    const focusNote = editDayFocus.trim();
    if (title.length < 2) {
      setDayDetailsError("Title needs at least 2 characters.");
      return;
    }
    const day = sortedDays.find((d) => d.id === dayId);
    if (!day) return;
    const nextFocus = focusNote === "" ? null : focusNote;
    if (title === day.title && nextFocus === (day.focusNote ?? null)) return;
    setDayDetailsError(null);
    setBusy(true);
    const res = await fetch(`/api/coach/program-days/${dayId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, focusNote: nextFocus }),
    });
    setBusy(false);
    if (!res.ok) {
      setDayDetailsError("Could not save. Try again.");
      return;
    }
    await refresh();
  }

  async function togglePublish() {
    setBusy(true);
    await fetch(`/api/coach/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !program.published }),
    });
    setBusy(false);
    await refresh();
  }

  async function saveDetails() {
    const title = editTitle.trim();
    const description = editDescription;
    if (title.length < 2) {
      setDetailsError("Title needs at least 2 characters.");
      return;
    }
    if (description.trim().length < 2) {
      setDetailsError("Description needs at least 2 characters.");
      return;
    }
    if (title === program.title && description === program.description) return;
    setDetailsError(null);
    setBusy(true);
    const res = await fetch(`/api/coach/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setBusy(false);
    if (!res.ok) {
      setDetailsError("Could not save. Try again.");
      return;
    }
    await refresh();
  }

  async function deleteProgram() {
    const label = program.published ? "published program" : "draft";
    if (
      !confirm(
        `Delete this ${label} “${program.title}”? All sessions and exercise blocks will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/coach/programs/${program.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return;
    router.push(listHref);
    router.refresh();
  }

  async function saveVisibility() {
    const next = assignTo === "" ? null : assignTo;
    if (next === program.assignedMemberId) return;
    setBusy(true);
    await fetch(`/api/coach/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedMemberId: next }),
    });
    setBusy(false);
    await refresh();
  }

  const listHref = program.assignedMemberId
    ? "/coach/programs?scope=tailored"
    : "/coach/programs";
  const listLabel = "← Programs library";

  const publishLabel = (() => {
    if (program.assignedMemberId && program.assignedMember) {
      return program.published
        ? `Unpublish for ${program.assignedMember.name}`
        : `Publish for ${program.assignedMember.name} only`;
    }
    return program.published ? "Unpublish" : "Publish for members";
  })();

  const visibilityDirty =
    (assignTo === "" ? null : assignTo) !== (program.assignedMemberId ?? null);

  const detailsDirty =
    editTitle.trim() !== program.title || editDescription !== program.description;

  const dayDetailsDirty = selectedDay
    ? editDayTitle.trim() !== selectedDay.title ||
      (editDayFocus.trim() === "" ? null : editDayFocus.trim()) !== (selectedDay.focusNote ?? null)
    : false;

  function renderSectionBlocks(
    dayId: string,
    section: LineSection,
    lines: Line[],
    sectionLabel: string
  ) {
    const sectionLines = lines.filter((l) => l.section === section);
    const blocks = groupLinesForDisplay(sectionLines);
    const isDropTarget =
      dropHint?.dayId === dayId &&
      dropHint.section === section &&
      dragging != null;

    function setHint(blockIndex: number) {
      setDropHint({ dayId, section, blockIndex });
    }

    function clearHintIfMine() {
      setDropHint((h) => (h?.dayId === dayId && h.section === section ? null : h));
    }

    return (
      <div
        className={`rounded-xl transition-colors ${
          isDropTarget ? "bg-gymsanity-50/80 ring-2 ring-gymsanity-300/60" : ""
        }`}
        onDragOver={(e) => {
          if (!dragging || dragging.dayId !== dayId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (blocks.length === 0) setHint(0);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) clearHintIfMine();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const payload = parseDragPayload(e);
          setDropHint(null);
          setDragging(null);
          if (!payload || payload.dayId !== dayId) return;
          const idx = dropHint?.dayId === dayId && dropHint.section === section
            ? dropHint.blockIndex
            : blocks.length;
          dropBlock(dayId, section, idx, payload);
        }}
      >
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gymsanity-100 bg-gymsanity-50/40 px-4 py-6 text-center text-sm text-gymsanity-700">
            No {sectionLabel.toLowerCase()} blocks yet.
            {dragging ? " Drop here to move." : ""}
          </p>
        ) : (
          <ol className="space-y-3">
            {blocks.map((block, blockIdx) => {
              const key = blockKeyFromDisplay(block);
              const isDraggingThis =
                dragging?.dayId === dayId && dragging.blockKey === key;
              const showLineBefore =
                isDropTarget && dropHint?.blockIndex === blockIdx;

              return (
                <li key={key} className="list-none">
                  {showLineBefore && (
                    <div className="mb-2 h-1 rounded-full bg-gymsanity-600" aria-hidden />
                  )}
                  <div
                    draggable={!busy}
                    onDragStart={(e) => onBlockDragStart(e, dayId, section, block)}
                    onDragEnd={() => {
                      setDragging(null);
                      setDropHint(null);
                    }}
                    onDragOver={(e) => {
                      if (!dragging || dragging.dayId !== dayId) return;
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "move";
                      const rect = e.currentTarget.getBoundingClientRect();
                      const before = e.clientY < rect.top + rect.height / 2;
                      setHint(before ? blockIdx : blockIdx + 1);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const payload = parseDragPayload(e);
                      const idx =
                        dropHint?.dayId === dayId && dropHint.section === section
                          ? dropHint.blockIndex
                          : blockIdx;
                      setDropHint(null);
                      setDragging(null);
                      if (!payload || payload.dayId !== dayId) return;
                      dropBlock(dayId, section, idx, payload);
                    }}
                    className={`rounded-2xl ${isDraggingThis ? "opacity-40" : ""}`}
                  >
                    {block.kind === "single" ? (
                      <div className="flex items-start gap-2">
                        <span className="pt-3">
                          <DragHandle label="Drag to reorder or move section" />
                        </span>
                        <div className="min-w-0 flex-1">
                          {renderLineRow(dayId, block.line, String(blockIdx + 1))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-3">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <DragHandle label="Drag pair group to reorder or move section" />
                            <p className="text-xs font-bold uppercase tracking-wide text-violet-900">
                              {pairTypeLabel(block.pairType)} ·{" "}
                              {block.lines.map((l) => pairLetter(l.pairOrder)).join(" → ")}
                            </p>
                          </div>
                          <p className="text-[11px] text-violet-900/80">
                            {pairFlowHint(block.pairType, block.lines.length)}
                          </p>
                        </div>
                        <ol className="space-y-2">
                          {block.lines.map((ln, i) => (
                            <li key={ln.id} className="list-none">
                              {renderLineRow(
                                dayId,
                                ln,
                                `${blockIdx + 1}${pairLetter(ln.pairOrder) || String(i + 1)}`
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {isDropTarget && dropHint?.blockIndex === blocks.length && (
              <div className="h-1 rounded-full bg-gymsanity-600" aria-hidden />
            )}
          </ol>
        )}
        <p className="mt-2 text-[11px] text-gymsanity-600">
          Drag blocks to reorder or move between Movement prep, Strength, and Cooldown.
        </p>
      </div>
    );
  }

  function renderAddBlockForm(dayId: string) {
    return (
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-gymsanity-100 bg-gymsanity-50/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="text-sm font-medium text-gymsanity-900">
          Section
          <select
            value={lineSection[dayId] ?? "STRENGTH"}
            onChange={(e) =>
              setLineSection((s) => ({
                ...s,
                [dayId]: e.target.value as LineSection,
              }))
            }
            className="mt-1 w-full min-w-[140px] rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
          >
            <option value="MOVEMENT_PREP">Movement prep</option>
            <option value="STRENGTH">Strength</option>
            <option value="COOLDOWN">Cooldown</option>
          </select>
        </label>
        <div className="min-w-[7rem]">
          <label className="text-sm font-medium text-gymsanity-900">
            # Sets (member checkboxes)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={addSetsDraft[dayId] ?? "3"}
              onChange={(e) => {
                setAddSetsError((s) => ({ ...s, [dayId]: null }));
                setAddSetsDraft((s) => ({ ...s, [dayId]: e.target.value }));
              }}
              onBlur={() => {
                const parsed = parseSetsWholeNumber(addSetsDraft[dayId] ?? "3");
                if (!parsed.ok) {
                  setAddSetsError((s) => ({ ...s, [dayId]: SETS_RANGE_MSG }));
                  setAddSetsDraft((s) => ({ ...s, [dayId]: "3" }));
                  return;
                }
                setAddSetsError((s) => ({ ...s, [dayId]: null }));
                setAddSetsDraft((s) => ({ ...s, [dayId]: String(parsed.value) }));
              }}
              aria-invalid={addSetsError[dayId] ? true : undefined}
              className={`mt-1 w-full min-w-[4rem] rounded-xl border px-3 py-2 ${
                addSetsError[dayId]
                  ? "border-red-400 bg-white ring-1 ring-red-200"
                  : "border-gymsanity-200"
              }`}
            />
          </label>
          {addSetsError[dayId] && (
            <p className="mt-1 text-xs text-red-700">{addSetsError[dayId]}</p>
          )}
        </div>
        {renderExercisePicker(dayId)}
        <label className="flex-[2] text-sm font-medium text-gymsanity-900">
          Prescription
          <input
            value={linePrescription[dayId] ?? ""}
            onChange={(e) => setLinePrescription((s) => ({ ...s, [dayId]: e.target.value }))}
            placeholder="e.g. 3 × 8–10 · 3s down"
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void addLine(dayId)}
          className="rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white"
        >
          Add block
        </button>
      </div>
    );
  }

  function renderDayPanel(d: Day) {
    return (
      <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
              Week {d.weekNumber} · Day {d.dayIndex}
            </p>
            {dayDetailsError && <p className="mt-2 text-sm text-red-700">{dayDetailsError}</p>}
            <div className="mt-2 grid gap-3">
              <label className="block text-sm font-medium text-gymsanity-900">
                Session title *
                <input
                  value={editDayTitle}
                  onChange={(e) => {
                    setDayDetailsError(null);
                    setEditDayTitle(e.target.value);
                  }}
                  disabled={busy}
                  className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 font-display text-lg font-semibold text-gymsanity-950"
                />
              </label>
              <label className="block text-sm font-medium text-gymsanity-900">
                Focus note
                <input
                  value={editDayFocus}
                  onChange={(e) => {
                    setDayDetailsError(null);
                    setEditDayFocus(e.target.value);
                  }}
                  disabled={busy}
                  placeholder="Optional — e.g. Upper body push"
                  className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={busy || !dayDetailsDirty}
              onClick={() => void saveDayDetails(d.id)}
              className="mt-3 rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save session details
            </button>
          </div>
          <button
            type="button"
            onClick={() => void deleteDay(d.id)}
            className="text-sm font-semibold text-red-700"
          >
            Delete session
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gymsanity-50 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
            Pair selected
          </span>
          <button
            type="button"
            disabled={busy || (selectedLines[d.id]?.size ?? 0) < 2}
            onClick={() => void pairSelected(d.id, "SUPERSET")}
            className="rounded-full border border-gymsanity-200 bg-white px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
          >
            Superset
          </button>
          <button
            type="button"
            disabled={busy || (selectedLines[d.id]?.size ?? 0) < 2}
            onClick={() => void pairSelected(d.id, "CIRCUIT")}
            className="rounded-full border border-gymsanity-200 bg-white px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
          >
            Circuit
          </button>
          <button
            type="button"
            disabled={busy || (selectedLines[d.id]?.size ?? 0) === 0}
            onClick={() => void unpairSelected(d.id)}
            className="rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Unpair
          </button>
        </div>

        <div className="mt-6 space-y-8">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-teal-800">
              Movement prep
            </h4>
            {renderSectionBlocks(d.id, "MOVEMENT_PREP", d.exercises, "Movement prep")}
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gymsanity-800">
              Strength
            </h4>
            {renderSectionBlocks(d.id, "STRENGTH", d.exercises, "Strength")}
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-sky-800">
              Cooldown
            </h4>
            {renderSectionBlocks(d.id, "COOLDOWN", d.exercises, "Cooldown")}
          </div>
        </div>

        {renderAddBlockForm(d.id)}
      </section>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-gymsanity-100 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link href={listHref} className="text-sm font-semibold text-gymsanity-800 hover:underline">
              {listLabel}
            </Link>
            <p className="mt-2 text-xs font-medium text-gymsanity-700">
              {program.weeks} week{program.weeks === 1 ? "" : "s"} · {sortedDays.length} session
              {sortedDays.length === 1 ? "" : "s"}
              {program.published ? " · Live" : " · Draft"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void togglePublish()}
              className="rounded-full border border-gymsanity-200 bg-white px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              {publishLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void deleteProgram()}
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete program
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-4 shadow-sm">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-gymsanity-800">
            Program details
          </h2>
          {detailsError && <p className="mt-2 text-sm text-red-700">{detailsError}</p>}
          <div className="mt-3 grid gap-3">
            <label className="block text-sm font-medium text-gymsanity-900">
              Name *
              <input
                value={editTitle}
                onChange={(e) => {
                  setDetailsError(null);
                  setEditTitle(e.target.value);
                }}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 font-display text-lg font-semibold text-gymsanity-950"
              />
            </label>
            <label className="block text-sm font-medium text-gymsanity-900">
              Description *
              <textarea
                value={editDescription}
                onChange={(e) => {
                  setDetailsError(null);
                  setEditDescription(e.target.value);
                }}
                disabled={busy}
                rows={2}
                className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !detailsDirty}
            onClick={() => void saveDetails()}
            className="mt-3 rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save name & description
          </button>
        </div>
      </div>

      {program.assignedMemberId && program.assignedMember ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
          <strong>{program.assignedMember.name}</strong> ({program.assignedMember.email}) is the only
          member who will see this program after you publish.
        </div>
      ) : (
        <div className="rounded-2xl border border-gymsanity-100 bg-gymsanity-50/60 px-4 py-3 text-sm text-gymsanity-900">
          <strong>Library program</strong> — visible to every member with digital programming access
          after you publish.
        </div>
      )}

      {members.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gymsanity-200 bg-white/90 p-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block flex-1 text-sm font-medium text-gymsanity-900">
            Who can see this program
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="mt-1 w-full max-w-md rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
            >
              <option value="">All members (library)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy || !visibilityDirty}
            onClick={() => void saveVisibility()}
            className="rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save visibility
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-72">
          <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-gymsanity-800">
                Sessions
              </h2>
              <button
                type="button"
                onClick={() => setShowAddDay((v) => !v)}
                className="text-xs font-semibold text-gymsanity-800 hover:underline"
              >
                {showAddDay ? "Cancel" : "+ Add"}
              </button>
            </div>

            {showAddDay && (
              <form onSubmit={addDay} className="mt-4 space-y-3 border-b border-gymsanity-50 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-medium text-gymsanity-900">
                    Week
                    <input
                      type="number"
                      min={1}
                      value={week}
                      onChange={(e) => setWeek(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-gymsanity-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-gymsanity-900">
                    Day #
                    <input
                      type="number"
                      min={1}
                      value={dayIdx}
                      onChange={(e) => setDayIdx(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-gymsanity-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-xs font-medium text-gymsanity-900">
                  Title *
                  <input
                    required
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gymsanity-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-gymsanity-900">
                  Focus note
                  <input
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gymsanity-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-gymsanity-700 py-2 text-xs font-semibold text-white"
                >
                  Add session
                </button>
              </form>
            )}

            {sortedDays.length === 0 ? (
              <p className="mt-4 text-sm text-gymsanity-700">
                No sessions yet. Add your first week/day above.
              </p>
            ) : (
              <div className="mt-4 max-h-[min(28rem,60vh)] space-y-4 overflow-y-auto pr-1">
                {weeksGrouped.map(([weekNum, days]) => (
                  <div key={weekNum}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gymsanity-600">
                      Week {weekNum}
                    </p>
                    <ul className="space-y-1">
                      {days.map((d) => {
                        const active = d.id === selectedDayId;
                        const blockCount = d.exercises.length;
                        return (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedDayId(d.id)}
                              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                active
                                  ? "bg-gymsanity-800 text-white"
                                  : "text-gymsanity-900 hover:bg-gymsanity-50"
                              }`}
                            >
                              <span className="font-semibold">
                                Day {d.dayIndex}
                                {active ? "" : " · "}
                              </span>
                              {!active && (
                                <span className="block truncate text-xs opacity-80">{d.title}</span>
                              )}
                              {active && (
                                <span className="mt-0.5 block truncate text-xs text-white/85">
                                  {d.title}
                                </span>
                              )}
                              <span
                                className={`mt-1 block text-[10px] ${
                                  active ? "text-white/70" : "text-gymsanity-600"
                                }`}
                              >
                                {blockCount} block{blockCount === 1 ? "" : "s"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {selectedDay ? (
            renderDayPanel(selectedDay)
          ) : (
            <div className="rounded-2xl border border-dashed border-gymsanity-200 bg-gymsanity-50/40 px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-gymsanity-950">
                Build your program week by week
              </p>
              <p className="mt-2 text-sm text-gymsanity-800">
                Add a session from the sidebar, then stack movement prep and strength blocks from your
                exercise library.
              </p>
              <button
                type="button"
                onClick={() => setShowAddDay(true)}
                className="mt-4 rounded-full bg-gymsanity-700 px-5 py-2 text-sm font-semibold text-white"
              >
                + Add first session
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
