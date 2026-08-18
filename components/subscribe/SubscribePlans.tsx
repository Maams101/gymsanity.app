"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatUsdFromCents,
  packTotalCents,
  sessionPackBySlug,
} from "@/lib/session-packs";

export type SubscribePlanCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  billingType: "ONE_TIME" | "SUBSCRIPTION";
  includesDigitalPrograms: boolean;
  allowsGroupBooking: boolean;
  allowsOneOnOneBooking: boolean;
  oneOnOneCreditsPerMonth: number;
};

export function SubscribePlans({
  plans,
  embeddedAvailable,
}: {
  plans: SubscribePlanCard[];
  embeddedAvailable: boolean;
}) {
  const [embeddedSlug, setEmbeddedSlug] = useState<string | null>(null);
  const [redirectLoading, setRedirectLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openEmbedded = useCallback((slug: string) => {
    setError(null);
    setEmbeddedSlug(slug);
  }, []);

  const closeEmbedded = useCallback(() => {
    setEmbeddedSlug(null);
  }, []);

  const onEmbeddedFatal = useCallback((msg: string) => {
    setError(msg);
    setEmbeddedSlug(null);
  }, []);

  const startRedirectCheckout = useCallback(async (planSlug: string) => {
    setRedirectLoading(planSlug);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug }),
    });
    setRedirectLoading(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Could not start checkout.");
      return;
    }
    const url = (data as { url?: string }).url;
    if (url) window.location.href = url;
  }, []);

  const packs = plans.filter((p) => p.billingType === "ONE_TIME");
  const subscriptions = plans.filter((p) => p.billingType === "SUBSCRIPTION");

  function pay(slug: string) {
    if (embeddedAvailable) openEmbedded(slug);
    else void startRedirectCheckout(slug);
  }

  return (
    <>
      {error && !embeddedSlug && (
        <p className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      )}

      {packs.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-gymsanity-950">Session packages</h2>
          <p className="mt-1 text-sm text-gymsanity-800/85">
            1:1 coaching packs. Larger packs lower the price per session.
          </p>
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {packs.map((p) => {
              const pack = sessionPackBySlug(p.slug);
              const perSession = pack
                ? formatUsdFromCents(pack.pricePerSessionCents)
                : null;
              const total = pack ? formatUsdFromCents(packTotalCents(pack)) : null;
              const savings = pack?.savingsPerSessionCents
                ? formatUsdFromCents(pack.savingsPerSessionCents)
                : null;
              return (
                <li
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm shadow-gymsanity-900/5"
                >
                  <h3 className="font-display text-xl font-semibold text-gymsanity-950">{p.name}</h3>
                  {total ? (
                    <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-gymsanity-950">
                      {total}
                    </p>
                  ) : null}
                  {perSession ? (
                    <p className="mt-1 text-sm font-medium text-gymsanity-700">
                      {perSession} per session
                    </p>
                  ) : null}
                  {savings ? (
                    <p className="mt-1 text-xs font-semibold text-green-800">
                      Save {savings} per session vs the 6-pack
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gymsanity-600">Base rate</p>
                  )}
                  <ul className="mt-4 flex-1 space-y-1 text-xs text-gymsanity-800/90">
                    <li>
                      ✓ {p.oneOnOneCreditsPerMonth} × 60-minute 1-on-1 sessions after checkout
                    </li>
                    <li>✓ Book private slots with session credits</li>
                    <li>✓ Program library &amp; app access</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => pay(p.slug)}
                    disabled={redirectLoading === p.slug}
                    className="mt-6 inline-flex w-full justify-center rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
                  >
                    {redirectLoading === p.slug ? "Redirecting…" : `Buy ${p.name}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {subscriptions.length > 0 ? (
        <section className={packs.length > 0 ? "mt-12" : "mt-10"}>
          {packs.length > 0 ? (
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">App membership</h2>
          ) : null}
          <ul className={`grid gap-5 md:grid-cols-2 ${packs.length > 0 ? "mt-5" : ""}`}>
            {subscriptions.map((p) => (
              <li
                key={p.id}
                className="flex flex-col rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm shadow-gymsanity-900/5"
              >
                <h3 className="font-display text-xl font-semibold text-gymsanity-950">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gymsanity-900/75">
                  {p.description}
                </p>
                <ul className="mt-4 space-y-1 text-xs text-gymsanity-800/90">
                  <li>{p.includesDigitalPrograms ? "✓ Digital programming" : "— No digital library"}</li>
                  <li>{p.allowsGroupBooking ? "✓ Group sessions" : "— No group booking"}</li>
                  <li>— 1:1 sessions sold separately as packs</li>
                </ul>
                <button
                  type="button"
                  onClick={() => pay(p.slug)}
                  disabled={redirectLoading === p.slug}
                  className="mt-6 inline-flex w-full justify-center rounded-full border border-gymsanity-300 bg-white px-5 py-2.5 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-60"
                >
                  {redirectLoading === p.slug ? "Redirecting…" : `Subscribe — ${p.name}`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {embeddedSlug && (
        <EmbeddedCheckoutModal
          planSlug={embeddedSlug}
          onClose={closeEmbedded}
          onFatalError={onEmbeddedFatal}
        />
      )}
    </>
  );
}

function EmbeddedCheckoutModal({
  planSlug,
  onClose,
  onFatalError,
}: {
  planSlug: string;
  onClose: () => void;
  onFatalError: (message: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;
    const mountTarget = mountEl;

    let cancelled = false;
    let embedded: { destroy: () => void } | null = null;

    async function run() {
      setPhase("loading");
      setLocalError(null);

      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pk) {
        onFatalError("Stripe publishable key is not configured.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, embedded: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error ?? "Could not start checkout.";
        if (cancelled) return;
        setLocalError(msg);
        setPhase("error");
        return;
      }

      const clientSecret = (data as { clientSecret?: string }).clientSecret;
      if (!clientSecret) {
        if (!cancelled) {
          setLocalError("Invalid checkout response.");
          setPhase("error");
        }
        return;
      }

      const stripe = await loadStripe(pk);
      if (cancelled || !stripe) {
        if (!stripe && !cancelled) {
          setLocalError("Could not load Stripe.");
          setPhase("error");
        }
        return;
      }

      const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret });
      if (cancelled) {
        checkout.destroy();
        return;
      }

      embedded = checkout;
      checkout.mount(mountTarget);
      setPhase("ready");
    }

    void run();

    return () => {
      cancelled = true;
      embedded?.destroy();
    };
  }, [planSlug, onFatalError]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gymsanity-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-checkout-title"
    >
      <div className="relative flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gymsanity-200 bg-white shadow-xl shadow-gymsanity-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-gymsanity-100 px-5 py-4">
          <div>
            <p id="stripe-checkout-title" className="font-display text-lg font-semibold text-gymsanity-950">
              Secure checkout
            </p>
            <p className="mt-0.5 text-xs text-gymsanity-800/80">
              Powered by Stripe — card details stay on Stripe&apos;s secure form.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-gymsanity-700 hover:bg-gymsanity-100"
          >
            Close
          </button>
        </div>

        <div className="min-h-[420px] flex-1 overflow-y-auto px-2 py-4">
          <div className="relative min-h-[480px]">
            {phase === "loading" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 px-4">
                <p className="text-center text-sm text-gymsanity-700">Loading checkout…</p>
              </div>
            )}
            {phase === "error" && localError && (
              <p className="px-4 py-12 text-center text-sm text-red-800">{localError}</p>
            )}
            <div ref={mountRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
