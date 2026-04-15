"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CoachCreateSlotForm() {
  const router = useRouter();
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [type, setType] = useState<"GROUP" | "ONE_ON_ONE">("GROUP");
  const [capacity, setCapacity] = useState(12);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Gymsanity Studio · NYC");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startAt || !endAt) return;
    setLoading(true);
    setError(null);
    const start = new Date(startAt);
    const end = new Date(endAt);
    const res = await fetch("/api/coach/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type,
        capacity: type === "GROUP" ? capacity : 1,
        title: title || undefined,
        location: location || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create slot.");
      return;
    }
    setStartAt("");
    setEndAt("");
    setTitle("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm"
    >
      <h2 className="font-display text-lg font-semibold text-gymsanity-950">Add availability</h2>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gymsanity-900">
          Start
          <input
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
        <label className="block text-sm font-medium text-gymsanity-900">
          End
          <input
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-gymsanity-900">
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "GROUP" | "ONE_ON_ONE")}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950"
        >
          <option value="GROUP">Group</option>
          <option value="ONE_ON_ONE">1:1</option>
        </select>
      </label>
      {type === "GROUP" && (
        <label className="block text-sm font-medium text-gymsanity-900">
          Capacity
          <input
            type="number"
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          />
        </label>
      )}
      <label className="block text-sm font-medium text-gymsanity-900">
        Title (optional)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
          placeholder="Morning sanity circuit"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Location
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Publish slot"}
      </button>
    </form>
  );
}
