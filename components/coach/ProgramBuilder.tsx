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

type Ex = { id: string; name: string; category: string; muscleGroup?: string };
type Line = {
  id: string;
  name: string;
  prescription: string;
  exerciseId: string | null;
  section: "MOVEMENT_PREP" | "STRENGTH";
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
  exercises,
  members = [],
}: {
  program: Program;
  exercises: Ex[];
  members?: MemberOption[];
}) {
  const router = useRouter();
  const [program, setProgram] = useState(initial);
  const [assignTo, setAssignTo] = useState<string>(initial.assignedMemberId ?? "");
  const [week, setWeek] = useState(1);
  const [dayIdx, setDayIdx] = useState(1);
  const [dayTitle, setDayTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [linePrescription, setLinePrescription] = useState<Record<string, string>>({});
  const [pickExercise, setPickExercise] = useState<Record<string, string>>({});
  const [lineSection, setLineSection] = useState<Record<string, "MOVEMENT_PREP" | "STRENGTH">>({});
  const [addSetsDraft, setAddSetsDraft] = useState<Record<string, string>>({});
  const [addSetsError, setAddSetsError] = useState<Record<string, string | null>>({});
  const [selectedLines, setSelectedLines] = useState<Record<string, Set<string>>>({});

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
    setDayTitle("");
    setFocus("");
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
    patch: Partial<{ section: "MOVEMENT_PREP" | "STRENGTH"; setCount: number }>
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

  function renderLineRow(dayId: string, ln: Line, indexLabel: string) {
    const checked = selectedLines[dayId]?.has(ln.id) ?? false;
    return (
      <li
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
                  section: e.target.value as "MOVEMENT_PREP" | "STRENGTH",
                })
              }
              className="rounded-lg border border-gymsanity-200 bg-white px-2 py-1 text-xs"
            >
              <option value="MOVEMENT_PREP">Movement prep</option>
              <option value="STRENGTH">Strength</option>
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
      </li>
    );
  }

  async function deleteDay(dayId: string) {
    if (!confirm("Delete this whole session day?")) return;
    await fetch(`/api/coach/program-days/${dayId}`, { method: "DELETE" });
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

  const listHref = program.assignedMemberId ? "/coach/member-programs" : "/coach/programs";
  const listLabel = program.assignedMemberId ? "← Member programs" : "← Programs";

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

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 border-b border-gymsanity-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={listHref} className="text-sm font-semibold text-gymsanity-800 hover:underline">
            {listLabel}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-gymsanity-950">{program.title}</h1>
          <p className="mt-1 text-sm text-gymsanity-900/75">{program.description}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void togglePublish()}
          className="rounded-full border border-gymsanity-200 bg-white px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
        >
          {publishLabel}
        </button>
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

      <form
        onSubmit={addDay}
        className="rounded-2xl border border-dashed border-gymsanity-200 bg-gymsanity-50/50 p-6"
      >
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Add session day</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-gymsanity-900">
            Week
            <input
              type="number"
              min={1}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gymsanity-900">
            Day #
            <input
              type="number"
              min={1}
              value={dayIdx}
              onChange={(e) => setDayIdx(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gymsanity-900 sm:col-span-1">
            Title *
            <input
              required
              value={dayTitle}
              onChange={(e) => setDayTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-medium text-gymsanity-900">
          Focus note
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Add day
        </button>
      </form>

      <div className="space-y-8">
        {program.days.map((d) => (
          <section
            key={d.id}
            className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
                  Week {d.weekNumber} · Day {d.dayIndex}
                </p>
                <h3 className="font-display text-xl font-semibold text-gymsanity-950">{d.title}</h3>
                {d.focusNote && <p className="text-sm text-gymsanity-800/80">{d.focusNote}</p>}
              </div>
              <button
                type="button"
                onClick={() => void deleteDay(d.id)}
                className="text-sm font-semibold text-red-700"
              >
                Delete day
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

            <ol className="mt-3 space-y-3">
              {groupLinesForDisplay(d.exercises).map((block, blockIdx) => {
                if (block.kind === "single") {
                  return renderLineRow(d.id, block.line, String(blockIdx + 1));
                }
                return (
                  <li
                    key={block.groupId}
                    className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-3"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-900">
                        {pairTypeLabel(block.pairType)} · {block.lines.map((l) => pairLetter(l.pairOrder)).join(" → ")}
                      </p>
                      <p className="text-[11px] text-violet-900/80">
                        {pairFlowHint(block.pairType, block.lines.length)}
                      </p>
                    </div>
                    <ol className="space-y-2">
                      {block.lines.map((ln, i) => renderLineRow(d.id, ln, `${blockIdx + 1}${pairLetter(ln.pairOrder) || String(i + 1)}`))}
                    </ol>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-gymsanity-50/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="text-sm font-medium text-gymsanity-900">
                Section
                <select
                  value={lineSection[d.id] ?? "STRENGTH"}
                  onChange={(e) =>
                    setLineSection((s) => ({
                      ...s,
                      [d.id]: e.target.value as "MOVEMENT_PREP" | "STRENGTH",
                    }))
                  }
                  className="mt-1 w-full min-w-[140px] rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
                >
                  <option value="MOVEMENT_PREP">Movement prep</option>
                  <option value="STRENGTH">Strength</option>
                </select>
              </label>
              <div className="min-w-[7rem]">
                <label className="text-sm font-medium text-gymsanity-900">
                  # Sets (member checkboxes)
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={addSetsDraft[d.id] ?? "3"}
                    onChange={(e) => {
                      setAddSetsError((s) => ({ ...s, [d.id]: null }));
                      setAddSetsDraft((s) => ({ ...s, [d.id]: e.target.value }));
                    }}
                    onBlur={() => {
                      const parsed = parseSetsWholeNumber(addSetsDraft[d.id] ?? "3");
                      if (!parsed.ok) {
                        setAddSetsError((s) => ({ ...s, [d.id]: SETS_RANGE_MSG }));
                        setAddSetsDraft((s) => ({ ...s, [d.id]: "3" }));
                        return;
                      }
                      setAddSetsError((s) => ({ ...s, [d.id]: null }));
                      setAddSetsDraft((s) => ({ ...s, [d.id]: String(parsed.value) }));
                    }}
                    aria-invalid={addSetsError[d.id] ? true : undefined}
                    className={`mt-1 w-full min-w-[4rem] rounded-xl border px-3 py-2 ${
                      addSetsError[d.id]
                        ? "border-red-400 bg-white ring-1 ring-red-200"
                        : "border-gymsanity-200"
                    }`}
                  />
                </label>
                {addSetsError[d.id] && (
                  <p className="mt-1 text-xs text-red-700">{addSetsError[d.id]}</p>
                )}
              </div>
              <label className="flex-1 text-sm font-medium text-gymsanity-900">
                From library
                <select
                  value={pickExercise[d.id] ?? ""}
                  onChange={(e) =>
                    setPickExercise((s) => ({ ...s, [d.id]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
                >
                  <option value="">Select exercise…</option>
                  {MUSCLE_GROUPS_ORDER.map((mg) => {
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
                  })}
                </select>
              </label>
              <label className="flex-[2] text-sm font-medium text-gymsanity-900">
                Prescription
                <input
                  value={linePrescription[d.id] ?? ""}
                  onChange={(e) =>
                    setLinePrescription((s) => ({ ...s, [d.id]: e.target.value }))
                  }
                  placeholder="e.g. 3 × 8–10 · 3s down"
                  className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void addLine(d.id)}
                className="rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Add block
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
