"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteRegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  const input =
    "w-full min-h-12 rounded-xl border border-gymsanity-200 bg-white px-4 py-2.5 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2";

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-900">
          {error}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="invite-name" className="text-sm font-medium text-gymsanity-900">
          Name
        </label>
        <input
          id="invite-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
          placeholder="Your name"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="invite-email" className="text-sm font-medium text-gymsanity-900">
          Email
        </label>
        <input
          id="invite-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
          placeholder="you@email.com"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="invite-password" className="text-sm font-medium text-gymsanity-900">
          Password
        </label>
        <input
          id="invite-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          placeholder="At least 8 characters"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full min-h-12 rounded-full bg-gymsanity-700 px-6 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account & get access"}
      </button>
      <p className="text-xs text-gymsanity-800/70 text-center">
        Already have an account?{" "}
        <a href="/login" className="underline hover:text-gymsanity-950">
          Log in
        </a>
      </p>
    </form>
  );
}
