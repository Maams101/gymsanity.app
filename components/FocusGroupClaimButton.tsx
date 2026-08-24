"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FocusGroupClaimButton({ loginNext }: { loginNext: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClaim() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/join/focus-group/claim", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not join the focus group.");
      return;
    }
    router.push(typeof data.next === "string" ? data.next : "/programs");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-900">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void onClaim()}
        disabled={loading}
        className="w-full min-h-12 rounded-full bg-gymsanity-700 px-6 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Joining…" : "Join focus group"}
      </button>
      <p className="text-xs text-gymsanity-800/70 text-center">
        Not you?{" "}
        <a href={`/login?next=${encodeURIComponent(loginNext)}`} className="underline hover:text-gymsanity-950">
          Sign in with a different account
        </a>
      </p>
    </div>
  );
}
