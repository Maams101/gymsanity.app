"use client";

import { useState } from "react";

export function CoachMemberNutritionForm({
  memberId,
  initialNotes,
}: {
  memberId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/coach/members/${memberId}/nutrition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachNotes: notes }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save.");
      return;
    }
    setMessage("Saved.");
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-3 space-y-2">
      <label className="block text-xs font-medium text-gymsanity-800">
        Your tailored nutrition notes for this member
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Macros to emphasize, meal timing, foods to limit, referrals to an RD, etc."
          className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-950"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save nutrition notes"}
        </button>
        {message && <span className="text-xs text-gymsanity-700">{message}</span>}
      </div>
      <p className="text-xs text-gymsanity-700/80">
        Members also see goal-based playbooks from onboarding. This block is your personal layer on top.
      </p>
    </form>
  );
}
