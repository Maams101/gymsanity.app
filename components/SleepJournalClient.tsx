"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type SleepEntryRow = {
  id: string;
  entryDate: string;
  hoursAsleep: number;
  bedtimeRoutine: string;
  dreamsRecalled: string;
};

function localDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SleepJournalClient({ initialEntries }: { initialEntries: SleepEntryRow[] }) {
  const router = useRouter();
  const byDate = useMemo(() => {
    const m = new Map<string, SleepEntryRow>();
    for (const e of initialEntries) m.set(e.entryDate, e);
    return m;
  }, [initialEntries]);

  const [entryDate, setEntryDate] = useState(() => localDateInputValue());
  const [hoursAsleep, setHoursAsleep] = useState("");
  const [bedtimeRoutine, setBedtimeRoutine] = useState("");
  const [dreamsRecalled, setDreamsRecalled] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const e = byDate.get(entryDate);
    setHoursAsleep(e != null ? String(e.hoursAsleep) : "");
    setBedtimeRoutine(e?.bedtimeRoutine ?? "");
    setDreamsRecalled(e?.dreamsRecalled ?? "");
  }, [byDate, entryDate]);

  const selected = byDate.get(entryDate);

  function selectDate(nextDate: string) {
    setEntryDate(nextDate);
    setError(null);
    setMessage(null);
  }

  async function save() {
    setError(null);
    setMessage(null);
    const h = Number(hoursAsleep);
    if (hoursAsleep === "" || Number.isNaN(h) || h < 0 || h > 24) {
      setError("Enter hours asleep between 0 and 24 (decimals OK, e.g. 7.5).");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryDate,
        hoursAsleep: h,
        bedtimeRoutine,
        dreamsRecalled,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not save.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function remove() {
    if (!selected) return;
    if (!confirm(`Remove the sleep log for ${entryDate}?`)) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/sleep/${encodeURIComponent(entryDate)}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not delete.");
      return;
    }
    setMessage("Removed.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Log a night</h2>
        <p className="mt-1 text-sm text-gymsanity-800/85">
          Pick the morning date you&apos;re logging (the night you woke up from). Track time actually
          asleep, your wind-down, and any dreams you remember.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gymsanity-900">
            Date
            <input
              type="date"
              value={entryDate}
              onChange={(e) => selectDate(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            />
          </label>

          <label className="block text-sm font-medium text-gymsanity-900">
            Hours asleep
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={24}
              step={0.25}
              value={hoursAsleep}
              onChange={(e) => setHoursAsleep(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
              placeholder="e.g. 7.5"
            />
            <span className="mt-1 block text-xs text-gymsanity-700">
              Estimate total time sleeping—not just time in bed.
            </span>
          </label>

          <label className="block text-sm font-medium text-gymsanity-900">
            Routine before bed
            <textarea
              value={bedtimeRoutine}
              onChange={(e) => setBedtimeRoutine(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950"
              placeholder="Screens off by 9, shower, tea, 10 min breathwork, lights out by 10:30…"
            />
          </label>

          <label className="block text-sm font-medium text-gymsanity-900">
            Dreams you recall
            <textarea
              value={dreamsRecalled}
              onChange={(e) => setDreamsRecalled(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950"
              placeholder="Optional—fragments, feelings, or vivid scenes."
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : selected ? "Update entry" : "Save entry"}
            </button>
            {selected ? (
              <button
                type="button"
                onClick={() => void remove()}
                className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50"
              >
                Delete this night
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Recent nights</h2>
        <p className="mt-1 text-sm text-gymsanity-800/85">Newest first. Tap a row to load that date.</p>
        {initialEntries.length === 0 ? (
          <p className="mt-4 text-sm text-gymsanity-700">No entries yet—log your first night above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gymsanity-100">
            {initialEntries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => selectDate(e.entryDate)}
                  className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-gymsanity-50/80 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="font-medium text-gymsanity-950">{e.entryDate}</span>
                  <span className="text-sm text-gymsanity-800/90">
                    <span className="font-semibold text-gymsanity-700">{e.hoursAsleep} h</span> asleep
                    {e.bedtimeRoutine.trim() ? " · routine logged" : ""}
                    {e.dreamsRecalled.trim() ? " · dreams noted" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
