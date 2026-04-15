"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SlotRow = {
  id: string;
  startAt: string;
  endAt: string;
  type: "GROUP" | "ONE_ON_ONE";
  title: string | null;
  location: string | null;
  capacity: number;
  bookedCount: number;
  myBookingId: string | null;
};

export function BookPageClient({
  allowsGroup,
  allowsOneOnOne,
  credits,
}: {
  allowsGroup: boolean;
  allowsOneOnOne: boolean;
  credits: number;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/slots");
    setLoading(false);
    if (!res.ok) {
      setError("Could not load slots.");
      return;
    }
    const data = await res.json();
    setSlots(data.slots);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function book(slotId: string) {
    setBusy(slotId);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not book.");
      return;
    }
    router.refresh();
    await load();
  }

  async function cancel(bookingId: string) {
    setBusy(bookingId);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not cancel.");
      return;
    }
    router.refresh();
    await load();
  }

  const visible = slots.filter((s) => {
    if (s.type === "GROUP") return allowsGroup;
    return allowsOneOnOne;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-4 text-sm text-gymsanity-900/80">
        <p>
          <span className="font-semibold text-gymsanity-950">1:1 credits:</span> {credits}
          {!allowsOneOnOne && (
            <span className="ml-2 text-gymsanity-800/80">
              — your plan doesn&apos;t include private coaching yet.
            </span>
          )}
        </p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-gymsanity-800">Loading openings…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gymsanity-800">No bookable slots right now. Check back soon.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => {
            const full = s.type === "GROUP" && s.bookedCount >= s.capacity;
            const booked = !!s.myBookingId;
            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gymsanity-950">
                    {s.title ?? (s.type === "GROUP" ? "Group class" : "1:1 coaching")}
                  </p>
                  <p className="text-sm text-gymsanity-900/75">
                    {new Date(s.startAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(s.endAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gymsanity-800/70">
                    {s.location ?? "Location TBD"} · {s.type === "GROUP" ? "Group" : "1:1"} ·{" "}
                    {s.type === "GROUP" ? `${s.bookedCount}/${s.capacity} spots` : "Private"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {booked && s.myBookingId ? (
                    <button
                      type="button"
                      onClick={() => void cancel(s.myBookingId!)}
                      disabled={busy === s.myBookingId}
                      className="rounded-full border border-gymsanity-200 bg-white px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
                    >
                      {busy === s.myBookingId ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void book(s.id)}
                      disabled={busy === s.id || full || (s.type === "ONE_ON_ONE" && credits < 1)}
                      className="rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === s.id ? "Booking…" : full ? "Full" : "Book"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
