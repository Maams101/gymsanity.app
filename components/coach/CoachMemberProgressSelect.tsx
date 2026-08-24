"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MemberOption = { id: string; name: string; email: string };

export function CoachMemberProgressSelect({
  members,
  selectedId,
}: {
  members: MemberOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = members.find((m) => m.id === selectedId);

  async function deleteMember() {
    if (!selectedMember) return;
    if (
      !confirm(
        `Remove ${selectedMember.name} (${selectedMember.email}) from Gymsanity? Their account, workouts, bookings, and membership data will be permanently deleted. Active Stripe subscriptions will be cancelled. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/coach/members/${selectedId}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setDeleting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete member.");
      return;
    }

    const remaining = members.filter((m) => m.id !== selectedId);
    if (remaining.length === 0) {
      router.replace("/coach/member-progress");
    } else {
      router.replace(`/coach/member-progress?member=${encodeURIComponent(remaining[0]!.id)}`);
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block flex-1 text-sm font-medium text-gymsanity-900">
          Select member
          <select
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setError(null);
              router.replace(`/coach/member-progress?member=${encodeURIComponent(id)}`);
            }}
            className="mt-2 w-full max-w-xl rounded-xl border border-gymsanity-200 bg-white px-3 py-2.5 text-gymsanity-950 shadow-sm focus:border-gymsanity-400 focus:outline-none focus:ring-1 focus:ring-gymsanity-400"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.email}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void deleteMember()}
          disabled={deleting || !selectedMember}
          className="min-h-10 shrink-0 rounded-full border border-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? "Removing…" : "Remove member"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gymsanity-700/80">
        Choose a member to view their progress report, onboarding summary, and nutrition notes.
      </p>
      {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
