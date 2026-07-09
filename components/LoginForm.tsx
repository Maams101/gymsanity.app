"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/today";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not sign in.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-8 shadow-sm">
      <div>
        <h1 className="font-display text-2xl font-semibold text-gymsanity-950">Welcome back</h1>
        <p className="mt-1 text-sm text-gymsanity-900/75">Log in to programs and bookings.</p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-medium text-gymsanity-900">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gymsanity-700 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-gymsanity-800/80">
        New here?{" "}
        <Link href="/register" className="font-semibold text-gymsanity-900 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
