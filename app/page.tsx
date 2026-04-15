import Link from "next/link";
import { FitnessRules } from "@/components/FitnessRules";

export default function HomePage() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col overflow-hidden px-6 pb-16 pt-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(46,16,101,0.72), rgba(124,58,237,0.40)), url('/images/aliou-sprint-hero.png')",
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/35" />

      <header className="flex items-center justify-between gap-4">
        <div className="font-display text-xl font-semibold tracking-tight text-gymsanity-950">
          Gymsanity
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-full bg-white/70 px-4 py-2 text-gymsanity-900 hover:bg-white/90"
          >
            Log in
          </Link>
          <Link
            href="/register?next=/onboarding"
            className="rounded-full bg-gymsanity-700 px-4 py-2 font-medium text-white shadow-sm shadow-gymsanity-900/10 hover:bg-gymsanity-800"
          >
            Join
          </Link>
        </div>
      </header>

      <main className="mt-16 flex flex-1 flex-col gap-10 md:mt-24">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gymsanity-700">
            More than physical
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-gymsanity-950 md:text-5xl">
            Train for <span className="text-gymsanity-700">sanity</span>
          </h1>
          <p className="text-lg leading-relaxed text-gymsanity-900/80">
            Gymsanity was built from the belief that fitness is mental, emotional, and spiritual
            balance. Programs, group sessions, and 1:1 coaching—structured around consistency and
            recovery.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/register?next=/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-gymsanity-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-gymsanity-900/15 transition hover:bg-gymsanity-800"
            >
              Start membership
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-gymsanity-200 bg-white/80 px-6 py-3 text-sm font-semibold text-gymsanity-900 shadow-sm hover:bg-white"
            >
              Member login
            </Link>
          </div>
        </div>

        <FitnessRules />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Digital programming",
              body: "Structured weeks with breath, strength, and recovery—clear prescriptions, no guesswork.",
            },
            {
              title: "Group sessions",
              body: "Train in community with slots that respect capacity and your pace.",
            },
            {
              title: "1:1 coaching",
              body: "Credits unlock private time—deeper accountability when you need it most.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-gymsanity-100 bg-white/80 p-5 shadow-sm shadow-gymsanity-900/5"
            >
              <h2 className="font-display text-lg font-semibold text-gymsanity-950">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gymsanity-900/75">{c.body}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gymsanity-800/70">
          Founded by Aliou Barry — built on resilience and consistency.
        </p>
      </main>
    </div>
  );
}
