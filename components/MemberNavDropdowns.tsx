"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MemberNavPreview } from "@/lib/member-nav-preview";

type MenuKey = "home" | "programs" | "progress" | "sleep" | "nutrition" | "book";

type Props = {
  preview: MemberNavPreview;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`ml-1 h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MemberNavDropdowns({ preview }: Props) {
  const [open, setOpen] = useState<MenuKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  function toggle(key: MenuKey) {
    setOpen((o) => (o === key ? null : key));
  }

  function activePath(prefix: string) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }

  function triggerClass(key: MenuKey) {
    const isOpen = open === key;
    const pathOn =
      (key === "home" && (pathname === "/dashboard" || pathname === "/day")) ||
      (key === "programs" && activePath("/programs")) ||
      (key === "progress" && activePath("/progress")) ||
      (key === "sleep" && activePath("/sleep")) ||
      (key === "nutrition" && activePath("/nutrition")) ||
      (key === "book" && activePath("/book"));
    return [
      "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-gymsanity-900 transition",
      isOpen || pathOn ? "bg-white shadow-sm ring-1 ring-gymsanity-200" : "hover:bg-white/70",
    ].join(" ");
  }

  return (
    <div ref={rootRef} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <div className="relative">
        <button
          type="button"
          className={triggerClass("home")}
          aria-expanded={open === "home"}
          aria-haspopup="true"
          onClick={() => toggle("home")}
        >
          Home
          <Chevron open={open === "home"} />
        </button>
        {open === "home" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Your rhythm
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gymsanity-800/90">
              Membership, accountability streak, and your next session—everything on the dashboard.
            </p>
            <Link
              href="/day"
              className="mt-3 flex flex-col rounded-xl border border-gymsanity-200 bg-gymsanity-50/80 p-3 hover:bg-gymsanity-50"
              onClick={() => setOpen(null)}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
                Day at a glance
              </span>
              <span className="mt-1 text-sm text-gymsanity-800">
                Today&apos;s training, macros, and recovery focus
              </span>
            </Link>
            {preview.planName && (
              <p className="mt-3 text-sm text-gymsanity-900">
                <span className="text-gymsanity-700">Plan:</span>{" "}
                <span className="font-medium text-gymsanity-950">{preview.planName}</span>
              </p>
            )}
            {preview.nextSession ? (
              <div className="mt-3 rounded-xl border border-gymsanity-100 bg-gymsanity-50/80 p-3">
                <p className="text-xs text-gymsanity-700">Continue</p>
                <p className="mt-1 font-medium text-gymsanity-950">{preview.nextSession.title}</p>
                <p className="text-xs text-gymsanity-800/75">{preview.nextSession.programTitle}</p>
                <Link
                  href={`/sessions/${preview.nextSession.id}`}
                  className="mt-2 inline-flex text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
                  onClick={() => setOpen(null)}
                >
                  Open session →
                </Link>
              </div>
            ) : preview.canAccessPrograms ? (
              <p className="mt-3 text-sm text-gymsanity-800/80">You&apos;re caught up on sessions.</p>
            ) : null}
            <Link
              href="/dashboard"
              className="mt-4 inline-flex w-full justify-center rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800"
              onClick={() => setOpen(null)}
            >
              Go to dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={triggerClass("programs")}
          aria-expanded={open === "programs"}
          aria-haspopup="true"
          onClick={() => toggle("programs")}
        >
          Programs
          <Chevron open={open === "programs"} />
        </button>
        {open === "programs" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Programs
            </p>
            <p className="mt-2 text-sm text-gymsanity-800/85">
              Structured blocks—breath, strength, recovery—in the Gymsanity voice.
            </p>
            {!preview.canAccessPrograms && (
              <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50/90 p-3 text-sm text-amber-950">
                Your plan doesn&apos;t include the digital library yet. Upgrade to unlock.
              </p>
            )}
            <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1 text-sm">
              {preview.programs.length === 0 ? (
                <li className="text-gymsanity-700">No published programs.</li>
              ) : (
                preview.programs.map((p) => (
                  <li key={p.id}>
                    {preview.canAccessPrograms ? (
                      <Link
                        href={`/programs/${p.id}`}
                        className="flex flex-col rounded-lg px-2 py-2 hover:bg-gymsanity-50"
                        onClick={() => setOpen(null)}
                      >
                        <span className="font-medium text-gymsanity-950">{p.title}</span>
                        <span className="text-xs text-gymsanity-700">
                          {p.weeks} weeks · {p.sessionCount} sessions
                        </span>
                      </Link>
                    ) : (
                      <span className="flex flex-col rounded-lg px-2 py-2 text-gymsanity-500">
                        <span className="font-medium">{p.title}</span>
                        <span className="text-xs">
                          {p.weeks} weeks · {p.sessionCount} sessions
                        </span>
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
            <Link
              href="/programs"
              className="mt-3 inline-flex w-full justify-center rounded-full border border-gymsanity-200 bg-white px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
              onClick={() => setOpen(null)}
            >
              Full programs page
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={triggerClass("progress")}
          aria-expanded={open === "progress"}
          aria-haspopup="true"
          onClick={() => toggle("progress")}
        >
          Progress
          <Chevron open={open === "progress"} />
        </button>
        {open === "progress" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Load progression
            </p>
            <p className="mt-2 text-sm text-gymsanity-800/85">
              See weight and reps logged from your strength sets—session by session, exercise by exercise.
            </p>
            <Link
              href="/progress"
              className="mt-4 inline-flex w-full justify-center rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900"
              onClick={() => setOpen(null)}
            >
              Open progression
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={triggerClass("sleep")}
          aria-expanded={open === "sleep"}
          aria-haspopup="true"
          onClick={() => toggle("sleep")}
        >
          Sleep
          <Chevron open={open === "sleep"} />
        </button>
        {open === "sleep" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Sleep journal
            </p>
            <p className="mt-2 text-sm text-gymsanity-800/85">
              Log nights, wind-down, and dreams—plus practical tips for deeper recovery.
            </p>
            <Link
              href="/sleep"
              className="mt-3 inline-flex w-full justify-center rounded-full bg-gymsanity-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-900"
              onClick={() => setOpen(null)}
            >
              Open sleep journal
            </Link>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1 text-sm">
              {preview.recentSleep.length === 0 ? (
                <li className="text-gymsanity-700">No nights logged yet.</li>
              ) : (
                preview.recentSleep.map((s) => (
                  <li key={s.entryDate}>
                    <Link
                      href="/sleep"
                      className="flex flex-col rounded-lg px-2 py-2 hover:bg-gymsanity-50"
                      onClick={() => setOpen(null)}
                    >
                      <span className="font-medium text-gymsanity-950">{s.entryDate}</span>
                      <span className="text-xs text-gymsanity-700">{s.hoursAsleep} h asleep</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={triggerClass("nutrition")}
          aria-expanded={open === "nutrition"}
          aria-haspopup="true"
          onClick={() => toggle("nutrition")}
        >
          Nutrition
          <Chevron open={open === "nutrition"} />
        </button>
        {open === "nutrition" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Fuel & habits
            </p>
            <p className="mt-2 text-sm text-gymsanity-800/85">
              Playbooks matched to your onboarding goals, plus notes from your coach when they add them.
            </p>
            <Link
              href="/nutrition"
              className="mt-4 inline-flex w-full justify-center rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800"
              onClick={() => setOpen(null)}
            >
              Open nutrition guide
            </Link>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={triggerClass("book")}
          aria-expanded={open === "book"}
          aria-haspopup="true"
          onClick={() => toggle("book")}
        >
          Book
          <Chevron open={open === "book"} />
        </button>
        {open === "book" && (
          <div
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gymsanity-200 bg-white p-4 shadow-lg shadow-gymsanity-900/10"
            role="menu"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Book sessions
            </p>
            <p className="mt-2 text-sm text-gymsanity-800/85">
              Reserve group classes or use a 1:1 credit for private coaching.
            </p>
            <p className="mt-3 rounded-xl border border-gymsanity-100 bg-gymsanity-50/80 p-3 text-sm">
              <span className="text-gymsanity-700">1:1 credits available:</span>{" "}
              <span className="font-semibold text-gymsanity-950">{preview.credits}</span>
            </p>
            <Link
              href="/book"
              className="mt-4 inline-flex w-full justify-center rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800"
              onClick={() => setOpen(null)}
            >
              Open booking
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
