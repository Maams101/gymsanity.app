"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  programDayId: string;
  initialNote: string;
  initiallyComplete: boolean;
};

export function CompleteSessionButton({ programDayId, initialNote, initiallyComplete }: Props) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [complete, setComplete] = useState(initiallyComplete);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountabilityHint, setAccountabilityHint] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    setAccountabilityHint(null);
    const res = await fetch("/api/workouts/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programDayId, note }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.accountability) {
      if (data.accountability.rewardedCredit) {
        setAccountabilityHint(
          "You hit 11 days in a row — a free 1:1 credit was added to your account."
        );
      } else if (typeof data.accountability.streak === "number") {
        setAccountabilityHint(
          `Accountability streak: ${data.accountability.streak} / 11 days toward a free 1:1.`
        );
      }
    }
    setComplete(true);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        placeholder="How did this session feel?"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {accountabilityHint && (
        <p className="text-sm font-medium text-gymsanity-900">{accountabilityHint}</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Saving…" : complete ? "Update reflection" : "Mark complete"}
      </button>
      {complete && (
        <p className="text-sm font-medium text-emerald-800">Logged for today. Consistency counts.</p>
      )}
    </div>
  );
}
