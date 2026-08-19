"use client";

import { useState } from "react";

export function FocusGroupFeedbackForm() {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const res = await fetch("/api/me/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, rating: rating ?? undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not send feedback.");
      setStatus("error");
      return;
    }
    setStatus("ok");
    setMessage("");
    setRating(null);
  }

  if (status === "ok") {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-900">Focus group feedback</h2>
        <p className="mt-2 text-sm text-green-950">
          Thanks — your note is with the coach. You can send another anytime.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-green-900 underline hover:no-underline"
        >
          Send more feedback
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Focus group feedback</h2>
      <p className="mt-2 text-sm text-gymsanity-900/75">
        You&apos;re in the focus group — tell us what&apos;s working, what&apos;s confusing, or what you&apos;d change.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-gymsanity-900">Overall experience (optional)</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className={`min-h-10 min-w-10 rounded-full border text-sm font-semibold transition-colors ${
                  rating === n
                    ? "border-gymsanity-600 bg-gymsanity-700 text-white"
                    : "border-gymsanity-200 bg-white text-gymsanity-800 hover:border-gymsanity-400"
                }`}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium text-gymsanity-900">
          Your feedback
          <textarea
            required
            minLength={10}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What felt clear? What was missing? Any bugs or ideas?"
            className="mt-2 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
          />
        </label>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Send feedback"}
        </button>
      </form>
    </section>
  );
}
