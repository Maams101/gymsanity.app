"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MemberWorkoutOfDayView } from "@/lib/workout-of-day";

type Props = {
  wod: MemberWorkoutOfDayView;
  variant?: "card" | "full";
};

export function WorkoutOfDayChallenge({ wod: initial, variant = "card" }: Props) {
  const router = useRouter();
  const [wod, setWod] = useState(initial);
  const [expanded, setExpanded] = useState(variant === "full");
  const [checkedBlocks, setCheckedBlocks] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState(wod.attemptNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked =
    wod.blocks.length > 0 && wod.blocks.every((_, i) => checkedBlocks[i]);

  async function completeChallenge() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/workout-of-day/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wodId: wod.id, note: note.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not save.");
      return;
    }
    const j = (await res.json()) as { attempt: { completedAt: string; note: string | null } };
    setWod((prev) => ({
      ...prev,
      attempted: true,
      attemptedAt: j.attempt.completedAt,
      attemptNote: j.attempt.note,
    }));
    router.refresh();
  }

  const shellClass =
    variant === "full"
      ? "rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm"
      : "rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-white/90 p-5 shadow-sm";

  return (
    <section className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-800">
            Coach&apos;s workout of the day
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-gymsanity-950">{wod.title}</h2>
          <p className="mt-1 text-sm text-gymsanity-800/85">
            From {wod.coachName} · {wod.blocks.length} movement{wod.blocks.length === 1 ? "" : "s"}
          </p>
        </div>
        {wod.attempted ? (
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            Challenge complete
          </span>
        ) : (
          <span className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-semibold text-violet-900">
            Try it today
          </span>
        )}
      </div>

      {wod.description ? (
        <p className="mt-4 text-sm leading-relaxed text-gymsanity-900/90">{wod.description}</p>
      ) : null}

      {!wod.attempted && !expanded && variant === "card" ? (
        <p className="mt-4 text-sm font-medium text-violet-950">
          Your coach posted a challenge—can you finish it today?
        </p>
      ) : null}

      {(expanded || variant === "full") && (
        <ol className="mt-5 space-y-3">
          {wod.blocks.map((block, i) => (
            <li
              key={`${block.name}-${i}`}
              className="flex gap-3 rounded-xl border border-gymsanity-100 bg-white/90 px-3 py-3"
            >
              {!wod.attempted ? (
                <input
                  type="checkbox"
                  checked={!!checkedBlocks[i]}
                  onChange={() => setCheckedBlocks((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className="mt-1 rounded text-violet-700"
                  aria-label={`Mark ${block.name} done`}
                />
              ) : (
                <span className="mt-0.5 text-emerald-600" aria-hidden>
                  ✓
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gymsanity-950">{block.name}</p>
                <p className="text-sm text-gymsanity-800/85">{block.prescription}</p>
                <p className="mt-0.5 text-xs text-gymsanity-600">{block.setCount} sets</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!wod.attempted && (
        <>
          {variant === "card" && !expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-4 rounded-full bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Accept the challenge
            </button>
          ) : (
            <div className="mt-5 space-y-4">
              {!allChecked && (
                <p className="text-xs text-gymsanity-700">
                  Check off each movement as you finish, then log the challenge.
                </p>
              )}
              <label className="block text-sm font-medium text-gymsanity-900">
                Quick note (optional)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="How it felt, scaling you used…"
                  className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm"
                />
              </label>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {error}
                </p>
              )}
              <button
                type="button"
                disabled={loading || !allChecked}
                onClick={() => void completeChallenge()}
                className="rounded-full bg-violet-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {loading ? "Saving…" : "I completed the challenge"}
              </button>
            </div>
          )}
        </>
      )}

      {wod.attempted && wod.attemptNote ? (
        <p className="mt-4 text-sm italic text-gymsanity-800/90">&ldquo;{wod.attemptNote}&rdquo;</p>
      ) : null}
    </section>
  );
}
