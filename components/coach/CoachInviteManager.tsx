"use client";

import { useState } from "react";

type Invite = {
  id: string;
  token: string;
  label: string;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  usedBy: { name: string; email: string } | null;
};

export function CoachInviteManager({
  initialInvites,
  appUrl,
}: {
  initialInvites: Invite[];
  appUrl: string;
}) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [label, setLabel] = useState("Focus Group");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/coach/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim() || "Focus Group",
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create invite.");
      return;
    }
    setInvites((prev) => [data.invite as Invite, ...prev]);
    setLabel("Focus Group");
    setExpiresInDays("");
  }

  async function remove(id: string) {
    await fetch(`/api/coach/invites?id=${id}`, { method: "DELETE" });
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  function inviteUrl(token: string) {
    return `${appUrl}/invite/${token}`;
  }

  function copy(token: string) {
    void navigator.clipboard.writeText(inviteUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-gymsanity-950">New invite link</h2>
        <p className="mt-1 text-xs text-gymsanity-800/75">
          Each link is single-use. Share it with one focus-group participant.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gymsanity-900">Label (for your reference)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
              placeholder="Focus Group"
            />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-xs font-medium text-gymsanity-900">Expires (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
              placeholder="Never"
            />
          </div>
          <button
            type="button"
            onClick={() => void create()}
            disabled={creating}
            className="min-h-10 rounded-full bg-gymsanity-700 px-5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Generate link"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
      </div>

      {/* Invite list */}
      {invites.length === 0 ? (
        <p className="text-sm text-gymsanity-800/70">No invite links yet.</p>
      ) : (
        <div className="space-y-3">
          {invites.map((inv) => {
            const url = inviteUrl(inv.token);
            const isExpired = inv.expiresAt ? new Date(inv.expiresAt) < new Date() : false;
            return (
              <div
                key={inv.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  inv.usedAt
                    ? "border-gymsanity-100 bg-gymsanity-50/60 opacity-70"
                    : isExpired
                    ? "border-red-100 bg-red-50/60"
                    : "border-gymsanity-100 bg-white/90"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gymsanity-950">{inv.label}</p>
                    {inv.usedAt ? (
                      <p className="text-xs text-gymsanity-700">
                        Used by {inv.usedBy?.name ?? "—"} ({inv.usedBy?.email ?? "—"}) ·{" "}
                        {new Date(inv.usedAt).toLocaleDateString()}
                      </p>
                    ) : isExpired ? (
                      <p className="text-xs text-red-700">Expired</p>
                    ) : (
                      <p className="text-xs text-green-700">Active</p>
                    )}
                    {inv.expiresAt && !inv.usedAt && (
                      <p className="text-xs text-gymsanity-800/60">
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!inv.usedAt && !isExpired && (
                      <button
                        type="button"
                        onClick={() => copy(inv.token)}
                        className="rounded-full border border-gymsanity-200 px-3 py-1.5 text-xs font-medium text-gymsanity-900 hover:bg-gymsanity-50"
                      >
                        {copied === inv.token ? "Copied!" : "Copy link"}
                      </button>
                    )}
                    {!inv.usedAt && (
                      <button
                        type="button"
                        onClick={() => void remove(inv.id)}
                        className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {!inv.usedAt && !isExpired && (
                  <p className="mt-2 break-all rounded-lg bg-gymsanity-50 px-3 py-1.5 font-mono text-xs text-gymsanity-800">
                    {url}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
