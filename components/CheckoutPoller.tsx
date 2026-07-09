"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 1800;
const MAX_ATTEMPTS = 50;

export function CheckoutPoller() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let n = 0;

    async function tick() {
      const res = await fetch("/api/me");
      if (cancelled) return;
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data.membership) {
        router.push("/today?checkout=success");
        router.refresh();
        return;
      }
      n += 1;
      if (n >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      setTimeout(tick, INTERVAL_MS);
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-gymsanity-100 bg-white/90 p-8 text-center shadow-sm">
      <p className="font-display text-lg font-semibold text-gymsanity-950">Finalizing your membership</p>
      <p className="mt-3 text-sm text-gymsanity-800/85">
        Payment received. We&apos;re syncing your account—usually just a few seconds.
      </p>
      {!timedOut ? (
        <p className="mt-4 text-xs text-gymsanity-700/80">Hang tight…</p>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-gymsanity-900">
          <p>This is taking longer than usual. Your payment may still be processing.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-gymsanity-700 px-5 py-2 font-semibold text-white hover:bg-gymsanity-800"
          >
            Refresh
          </button>
          <p>
            <a href="/subscribe" className="font-semibold text-gymsanity-800 underline">
              Back to plans
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
