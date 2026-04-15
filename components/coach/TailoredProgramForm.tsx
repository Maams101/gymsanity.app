"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string; email: string };

export function TailoredProgramForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setLoading(true);
    const res = await fetch("/api/coach/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        weeks,
        published: false,
        assignedMemberId: memberId,
      }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/coach/programs/${data.program.id}`);
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
        No members in the system yet. Have someone register, then create a tailored program here.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"
    >
      <h2 className="font-display text-lg font-semibold text-gymsanity-950">New tailored program</h2>
      <p className="mt-2 text-sm text-gymsanity-800/85">
        This program will only appear for the member you choose after you publish it from the
        builder.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gymsanity-900 sm:col-span-2">
          Member *
          <select
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gymsanity-900 sm:col-span-2">
          Title *
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-gymsanity-900 sm:col-span-2">
          Description *
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-gymsanity-900">
          Target weeks
          <input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white"
      >
        {loading ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
