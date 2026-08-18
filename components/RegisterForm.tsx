"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Plan = {
  slug: string;
  name: string;
  description: string;
};

/** After signup, members go to goals onboarding first unless `?next=` overrides (e.g. next=/today). */
function postRegisterPath(searchParams: URLSearchParams): "/onboarding" | "/today" {
  const raw = searchParams.get("next");
  if (raw === "/today" || raw === "/dashboard") return "/today";
  return "/onboarding";
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterRegister = useMemo(() => postRegisterPath(searchParams), [searchParams]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [planSlug, setPlanSlug] = useState("digital");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/plans");
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data.plans);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, planSlug }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not register.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl as string;
      return;
    }
    router.push(afterRegister);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-8 shadow-sm"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-gymsanity-950">Join Gymsanity</h1>
        <p className="mt-1 text-sm text-gymsanity-900/75">Membership, programming, and booking in one place.</p>
        <p className="mt-2 text-xs text-gymsanity-800/80">
          Creating an account also adds you to the Gymsanity newsletter. Unsubscribe anytime from Settings or any
          email.
        </p>
        {afterRegister === "/onboarding" && (
          <p className="mt-2 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs text-violet-950">
            After you create your account: short onboarding (fitness, goals, habits, health), then
            you&apos;ll pick a plan and complete payment before full access.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-medium text-gymsanity-900">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Password (min 8 characters)
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-gymsanity-900">
        Plan
        <select
          value={planSlug}
          onChange={(e) => setPlanSlug(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
        >
          {plans.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
          {plans.length === 0 && (
            <>
              <option value="digital">Digital</option>
              <option value="sessions-6">6 sessions</option>
              <option value="sessions-12">12 sessions</option>
              <option value="sessions-24">24 sessions</option>
            </>
          )}
        </select>
      </label>
      {plans.find((p) => p.slug === planSlug) && (
        <p className="text-xs text-gymsanity-800/80">
          {plans.find((p) => p.slug === planSlug)?.description}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gymsanity-700 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-sm text-gymsanity-800/80">
        Already a member?{" "}
        <Link
          href={afterRegister === "/onboarding" ? "/login?next=/onboarding" : "/login"}
          className="font-semibold text-gymsanity-900 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
