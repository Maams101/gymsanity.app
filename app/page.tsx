import Link from "next/link";
import { FitnessRules } from "@/components/FitnessRules";

export default function HomePage() {
  return (
    <div className="relative isolate min-h-dvh w-full overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-no-repeat bg-[center_bottom]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(46,16,101,0.72), rgba(124,58,237,0.40)), url('/images/aliou-hero.jpg')",
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/35" />

      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="font-display text-lg font-semibold tracking-tight text-gymsanity-950 sm:text-xl">
            Gymsanity
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full bg-white/70 px-3.5 py-2 text-gymsanity-900 hover:bg-white/90 sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/register?next=/onboarding"
              className="inline-flex min-h-11 items-center rounded-full bg-gymsanity-700 px-3.5 py-2 font-medium text-white shadow-sm shadow-gymsanity-900/10 hover:bg-gymsanity-800 sm:px-4"
            >
              Join
            </Link>
          </div>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-8 sm:mt-12 sm:gap-10 md:mt-20 lg:mt-24">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gymsanity-700 sm:text-sm">
              More than physical
            </p>
            <h1 className="font-display text-[clamp(1.85rem,6vw,3.15rem)] font-semibold leading-[1.15] text-balance text-gymsanity-950">
              Train for <span className="text-gymsanity-700">sanity</span>
            </h1>
            <p className="text-base leading-relaxed text-pretty text-gymsanity-900/80 sm:text-lg">
              Gymsanity was built from the belief that fitness is mental, emotional, and spiritual
              balance. Programs, group sessions, and 1:1 coaching—structured around consistency and
              recovery.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:pt-2">
              <Link
                href="/register?next=/onboarding"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gymsanity-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-gymsanity-900/15 transition hover:bg-gymsanity-800 sm:w-auto"
              >
                Start membership
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-gymsanity-200 bg-white/80 px-6 py-3 text-sm font-semibold text-gymsanity-900 shadow-sm hover:bg-white sm:w-auto"
              >
                Member login
              </Link>
            </div>
          </div>

          <FitnessRules />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <footer className="mt-auto flex flex-wrap gap-4 border-t border-gymsanity-100/80 pt-6 text-sm text-gymsanity-800/70">
            <Link href="/privacy" className="hover:text-gymsanity-950">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gymsanity-950">
              Terms
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
