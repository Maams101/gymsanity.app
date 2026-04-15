"use client";

import { useState } from "react";

export function SubscribeCheckoutButton({
  planSlug,
  label,
}: {
  planSlug?: string;
  /** Button text when not loading */
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planSlug ? { planSlug } : {}),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not start checkout.");
      return;
    }
    if (data.url) window.location.href = data.url as string;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={() => void go()}
        disabled={loading}
        className="inline-flex rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Redirecting…" : (label ?? "Complete payment")}
      </button>
    </div>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not open billing portal.");
      return;
    }
    if (data.url) window.location.href = data.url as string;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={() => void go()}
        disabled={loading}
        className="text-sm font-semibold text-gymsanity-800 underline-offset-2 hover:underline disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
    </div>
  );
}
