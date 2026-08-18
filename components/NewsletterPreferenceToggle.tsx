"use client";

import { useState } from "react";

export function NewsletterPreferenceToggle({ initialSubscribed }: { initialSubscribed: boolean }) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !subscribed;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/me/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscribed: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not update that. Try again.");
      return;
    }
    setSubscribed(next);
  }

  return (
    <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Newsletter</h2>
      <p className="mt-2 text-sm text-gymsanity-800/85">
        Training notes and studio updates from Gymsanity. We don’t sell your email.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void toggle()}
        className="mt-4 rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Saving…" : subscribed ? "Unsubscribe" : "Join the list"}
      </button>
      <p className="mt-2 text-xs text-gymsanity-700">
        {subscribed ? "You’re currently subscribed." : "You’re not on the list."}
      </p>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </section>
  );
}
