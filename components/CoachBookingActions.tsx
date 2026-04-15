"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  bookingId: string;
};

export function CoachBookingActions({ bookingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(status: "COMPLETED" | "NO_SHOW") {
    setLoading(true);
    await fetch(`/api/coach/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void patch("COMPLETED")}
        className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        Complete
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => void patch("NO_SHOW")}
        className="rounded-full border border-gymsanity-200 bg-white px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
      >
        No-show
      </button>
    </div>
  );
}
