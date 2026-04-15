"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewProgramForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/coach/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, weeks, published: false }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/coach/programs/${data.program.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"
    >
      <h2 className="font-display text-lg font-semibold text-gymsanity-950">New program</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
