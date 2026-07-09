"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FitnessProvider } from "@prisma/client";
import type { FitnessConnectionView } from "@/lib/fitness-connections";
import { FITNESS_PROVIDERS } from "@/lib/fitness-providers";

type Props = {
  initialConnections: FitnessConnectionView[];
};

export function FitnessIntegrationsPanel({ initialConnections }: Props) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [loading, setLoading] = useState<FitnessProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  function isConnected(provider: FitnessProvider) {
    return connections.some((c) => c.provider === provider && c.status === "CONNECTED");
  }

  function connectionFor(provider: FitnessProvider) {
    return connections.find((c) => c.provider === provider);
  }

  async function connect(provider: FitnessProvider) {
    setError(null);
    setLoading(provider);
    const res = await fetch("/api/me/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    setLoading(null);
    if (!res.ok) {
      setError("Could not connect. Try again.");
      return;
    }
    const j = (await res.json()) as { connection: FitnessConnectionView };
    setConnections((prev) => {
      const rest = prev.filter((c) => c.provider !== provider);
      return [...rest, j.connection];
    });
    router.refresh();
  }

  async function disconnect(provider: FitnessProvider) {
    setError(null);
    setLoading(provider);
    const res = await fetch(
      `/api/me/integrations?provider=${encodeURIComponent(provider)}`,
      { method: "DELETE" }
    );
    setLoading(null);
    if (!res.ok) {
      setError("Could not disconnect.");
      return;
    }
    setConnections((prev) =>
      prev.map((c) =>
        c.provider === provider ? { ...c, status: "DISCONNECTED" as const } : c
      )
    );
    router.refresh();
  }

  async function sync(provider: FitnessProvider) {
    setError(null);
    setLoading(provider);
    const res = await fetch("/api/me/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    setLoading(null);
    if (!res.ok) {
      setError("Sync failed.");
      return;
    }
    const j = (await res.json()) as { connection: FitnessConnectionView };
    setConnections((prev) => {
      const rest = prev.filter((c) => c.provider !== provider);
      return [...rest, j.connection];
    });
    router.refresh();
  }

  return (
    <section id="integrations" className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-gymsanity-950">Connected devices</h2>
        <p className="mt-1 text-sm text-gymsanity-800/85">
          Link wearables and health apps so sleep and activity flow into your recovery journal—like
          CoachRx lifestyle integrations.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {FITNESS_PROVIDERS.map((p) => {
          const connected = isConnected(p.id);
          const conn = connectionFor(p.id);
          const busy = loading === p.id;

          return (
            <li
              key={p.id}
              className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${p.accent}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gymsanity-950">{p.name}</h3>
                  <p className="mt-0.5 text-sm text-gymsanity-800/85">{p.tagline}</p>
                  <p className="mt-2 text-xs text-gymsanity-700">
                    Syncs: {p.syncs.join(" · ")}
                  </p>
                  {connected && conn?.lastSyncAt ? (
                    <p className="mt-1 text-xs text-gymsanity-600">
                      Last sync{" "}
                      {new Date(conn.lastSyncAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {conn.lastSnapshot?.sleepHours != null
                        ? ` · ${conn.lastSnapshot.sleepHours} h sleep`
                        : ""}
                    </p>
                  ) : null}
                  {p.id === "APPLE_HEALTH" && !connected ? (
                    <p className="mt-2 text-xs text-gymsanity-700/90">
                      On iPhone: add Gymsanity to your Home Screen, then connect—Health data syncs
                      when our native bridge is enabled.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {connected ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void sync(p.id)}
                        className="rounded-full border border-gymsanity-300 bg-white px-4 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-50"
                      >
                        {busy ? "…" : "Sync now"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void disconnect(p.id)}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold text-gymsanity-700 hover:text-red-800 disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void connect(p.id)}
                      className="rounded-full bg-gymsanity-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-50"
                    >
                      {busy ? "Connecting…" : "Connect"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-gymsanity-700/90">
        Demo mode connects instantly and syncs sample metrics into your sleep journal. Production
        OAuth for Fitbit, Garmin, Google Fit, WHOOP, Oura, and Strava uses server keys in your
        environment.
      </p>
    </section>
  );
}
