"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WodBlock } from "@/lib/workout-of-day-schema";

function localDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyBlock = (): WodBlock => ({
  name: "",
  prescription: "",
  setCount: 3,
});

type Props = {
  initialDayKey?: string;
  initialWod?: {
    title: string;
    description: string;
    blocks: WodBlock[];
    published: boolean;
  } | null;
};

export function CoachWorkoutOfDayForm({ initialDayKey, initialWod }: Props) {
  const router = useRouter();
  const [dayKey, setDayKey] = useState(initialDayKey ?? localDateInputValue());
  const [title, setTitle] = useState(initialWod?.title ?? "");
  const [description, setDescription] = useState(initialWod?.description ?? "");
  const [blocks, setBlocks] = useState<WodBlock[]>(
    initialWod?.blocks?.length ? initialWod.blocks : [emptyBlock(), emptyBlock()]
  );
  const [published, setPublished] = useState(initialWod?.published ?? true);
  const [loading, setLoading] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialDayKey === dayKey && initialWod) return;
    let cancelled = false;
    setLoadingDay(true);
    setError(null);
    setMessage(null);
    void fetch(`/api/coach/workout-of-day?day=${encodeURIComponent(dayKey)}`)
      .then((r) => r.json())
      .then((j: { wod?: Props["initialWod"] & { title: string } | null }) => {
        if (cancelled) return;
        const w = j.wod;
        if (w) {
          setTitle(w.title);
          setDescription(w.description ?? "");
          setBlocks(w.blocks?.length ? w.blocks : [emptyBlock()]);
          setPublished(w.published ?? true);
        } else {
          setTitle("");
          setDescription("");
          setBlocks([emptyBlock(), emptyBlock()]);
          setPublished(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load workout for that day.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDay(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dayKey, initialDayKey, initialWod]);

  function updateBlock(index: number, patch: Partial<WodBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  async function save() {
    setError(null);
    setMessage(null);
    const cleanBlocks = blocks.filter((b) => b.name.trim() && b.prescription.trim());
    if (!title.trim()) {
      setError("Add a title for today's workout.");
      return;
    }
    if (cleanBlocks.length === 0) {
      setError("Add at least one movement with a name and prescription.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/coach/workout-of-day", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayKey,
        title: title.trim(),
        description: description.trim(),
        blocks: cleanBlocks,
        published,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not save.");
      return;
    }
    setMessage(published ? "Published for members." : "Saved as draft.");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove the workout of the day for ${dayKey}?`)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/coach/workout-of-day?day=${encodeURIComponent(dayKey)}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not remove.");
      return;
    }
    setTitle("");
    setDescription("");
    setBlocks([emptyBlock(), emptyBlock()]);
    setMessage("Removed.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-gymsanity-950">Workout of the day</h2>
      <p className="mt-2 text-sm text-gymsanity-900/75">
        Publish a daily challenge for all members—shows on their dashboard and Day at a glance.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-gymsanity-900">
          Date
          <input
            type="date"
            value={dayKey}
            onChange={(e) => setDayKey(e.target.value)}
            className="rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
        <label className="flex items-end gap-2 text-sm font-medium text-gymsanity-900">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded text-gymsanity-700"
          />
          Visible to members
        </label>
      </div>

      {loadingDay ? (
        <p className="mt-4 text-sm text-gymsanity-700">Loading…</p>
      ) : (
        <>
          <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-gymsanity-900">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sanity 20 — full-body burner"
              className="rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-gymsanity-900">
            Coach note (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Why today’s workout, scaling options, mindset cue…"
              className="rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950"
            />
          </label>

          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold text-gymsanity-900">Movements</p>
            {blocks.map((block, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-xl border border-gymsanity-100 bg-gymsanity-50/60 p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
              >
                <label className="flex flex-col gap-0.5 text-xs font-medium text-gymsanity-800">
                  Name
                  <input
                    type="text"
                    value={block.name}
                    onChange={(e) => updateBlock(i, { name: e.target.value })}
                    className="rounded-lg border border-gymsanity-200 bg-white px-2 py-1.5 text-sm"
                    placeholder="Goblet squat"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-xs font-medium text-gymsanity-800">
                  Prescription
                  <input
                    type="text"
                    value={block.prescription}
                    onChange={(e) => updateBlock(i, { prescription: e.target.value })}
                    className="rounded-lg border border-gymsanity-200 bg-white px-2 py-1.5 text-sm"
                    placeholder="3 × 10 · controlled tempo"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-xs font-medium text-gymsanity-800">
                  Sets
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={block.setCount}
                    onChange={(e) =>
                      updateBlock(i, { setCount: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })
                    }
                    className="w-16 rounded-lg border border-gymsanity-200 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setBlocks((prev) => prev.filter((_, j) => j !== i))}
                  disabled={blocks.length <= 1}
                  className="self-end text-xs font-semibold text-red-800 hover:text-red-950 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBlocks((prev) => [...prev, emptyBlock()])}
              className="text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
            >
              + Add movement
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void save()}
              className="rounded-full bg-gymsanity-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-50"
            >
              {loading ? "Saving…" : published ? "Publish workout" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void remove()}
              className="rounded-full border border-gymsanity-300 px-5 py-2.5 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
            >
              Clear day
            </button>
          </div>
        </>
      )}
    </div>
  );
}
