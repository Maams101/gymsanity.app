"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DayAtAGlance } from "@/lib/day-at-a-glance";

type Props = {
  data: DayAtAGlance;
  /** Compact card for dashboard; full layout on /day. */
  variant?: "compact" | "full";
};

const RECOVERY_CHECK_KEY = "gymsanity-recovery-check";

function recoveryStorageKey(dateKey: string) {
  return `${RECOVERY_CHECK_KEY}-${dateKey}`;
}

export function DayAtAGlancePanel({ data, variant = "full" }: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(recoveryStorageKey(data.dateKey));
      if (raw) setChecked(JSON.parse(raw) as Record<number, boolean>);
    } catch {
      /* ignore */
    }
  }, [data.dateKey]);

  function toggleFocus(index: number) {
    setChecked((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      try {
        localStorage.setItem(recoveryStorageKey(data.dateKey), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const showHeader = variant === "full";
  const gridClass =
    variant === "compact"
      ? "grid gap-4 md:grid-cols-2"
      : "grid gap-6 lg:grid-cols-2";

  return (
    <section
      className={
        variant === "compact"
          ? "rounded-2xl border border-gymsanity-200 bg-gradient-to-br from-white via-gymsanity-50/40 to-violet-50/30 p-6 shadow-sm"
          : "space-y-6"
      }
    >
      {showHeader ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">
            Day at a glance
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-gymsanity-950">{data.dateLabel}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gymsanity-900/75">
            Your training itinerary, macro targets, and recovery focus for today—pulled from your program,
            bookings, and onboarding.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-gymsanity-950">Day at a glance</h2>
            <p className="mt-0.5 text-sm text-gymsanity-800/85">{data.dateLabel}</p>
          </div>
          <Link
            href="/day"
            className="rounded-full border border-gymsanity-300 px-4 py-1.5 text-sm font-semibold text-gymsanity-900 hover:bg-white/80"
          >
            Full view
          </Link>
        </div>
      )}

      <div className={gridClass}>
        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Training</h3>
          {data.programSessionCompletedToday ? (
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
              Program session logged today — streak {data.streak}/11.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gymsanity-700">
              Realistic rhythm: {data.sessionsPerWeekLabel}
            </p>
          )}
          {data.training.length === 0 ? (
            <p className="mt-3 text-sm text-gymsanity-800">
              No programmed session or bookings on the calendar for today. Rest, recover, or browse{" "}
              <Link href="/programs" className="font-semibold underline hover:text-gymsanity-950">
                programs
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.training.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gymsanity-100 bg-gymsanity-50/50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gymsanity-950">{item.title}</p>
                    {item.subtitle ? (
                      <p className="mt-0.5 text-xs text-gymsanity-800/80">{item.subtitle}</p>
                    ) : null}
                    {item.timeLabel ? (
                      <p className="mt-1 text-xs font-medium text-gymsanity-700">{item.timeLabel}</p>
                    ) : null}
                  </div>
                  <Link
                    href={item.href}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      item.kind === "coach_wod"
                        ? "bg-violet-700 text-white hover:bg-violet-800"
                        : "bg-gymsanity-700 text-white hover:bg-gymsanity-800"
                    }`}
                  >
                    {item.done
                      ? "Done"
                      : item.kind === "coach_wod"
                        ? "Try it"
                        : item.kind === "program_session"
                          ? "Start"
                          : "View"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/book"
            className="mt-4 inline-block text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
          >
            Book a session →
          </Link>
        </div>

        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Macros (estimate)
          </h3>
          {data.macros ? (
            <>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-gymsanity-950">
                {data.macros.calories.toLocaleString()}
                <span className="ml-1 text-base font-medium text-gymsanity-700">kcal</span>
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gymsanity-50 px-2 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-gymsanity-600">
                    Protein
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-gymsanity-950">
                    {data.macros.proteinG}g
                  </dd>
                </div>
                <div className="rounded-xl bg-gymsanity-50 px-2 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-gymsanity-600">
                    Carbs
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-gymsanity-950">
                    {data.macros.carbsG}g
                  </dd>
                </div>
                <div className="rounded-xl bg-gymsanity-50 px-2 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-gymsanity-600">
                    Fat
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-gymsanity-950">
                    {data.macros.fatG}g
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-gymsanity-800/90">{data.macros.goalNote}</p>
              {data.nutritionTip ? (
                <p className="mt-2 text-xs text-gymsanity-700">
                  <span className="font-semibold text-gymsanity-900">Tip:</span> {data.nutritionTip}
                </p>
              ) : null}
              {data.coachNutritionNote && variant === "full" ? (
                <p className="mt-3 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs text-gymsanity-900">
                  <span className="font-semibold text-violet-900">Coach:</span>{" "}
                  {data.coachNutritionNote.length > 160
                    ? `${data.coachNutritionNote.slice(0, 160)}…`
                    : data.coachNutritionNote}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-gymsanity-800">
              Add height, weight, age, and sex in onboarding to unlock macro estimates.
            </p>
          )}
          <Link
            href="/nutrition"
            className="mt-4 inline-block text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
          >
            Nutrition playbooks →
          </Link>
        </div>

        <div
          className={`rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm ${
            variant === "full" ? "lg:col-span-2" : ""
          }`}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Recovery</h3>
          {data.recovery ? (
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gymsanity-950">
                  Sleep target: {data.recovery.sleepTarget.label}
                </p>
                <p className="mt-1 text-xs text-gymsanity-800/85">{data.recovery.sleepTarget.aspirational}</p>
                <p className="mt-3 text-sm text-gymsanity-900">
                  Last night{" "}
                  {data.lastNightSleepHours != null ? (
                    <span className="font-semibold tabular-nums">{data.lastNightSleepHours} h logged</span>
                  ) : (
                    <span className="text-gymsanity-700">not logged yet</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-gymsanity-700">
                  Stress load: {data.recovery.stressLevel}
                </p>
                {data.recovery.practices.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-gymsanity-800">
                    {data.recovery.practices.map((p) => (
                      <li key={p.key}>· {p.label}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
                  Today&apos;s focus
                </p>
                <ul className="mt-2 space-y-2">
                  {data.recovery.dailyFocus.map((line, i) => (
                    <li key={line}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm text-gymsanity-900">
                        <input
                          type="checkbox"
                          checked={!!checked[i]}
                          onChange={() => toggleFocus(i)}
                          className="mt-0.5 rounded text-gymsanity-700"
                        />
                        <span className={checked[i] ? "text-gymsanity-600 line-through" : ""}>{line}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gymsanity-800">Complete onboarding to personalize recovery goals.</p>
          )}
          <Link
            href="/sleep"
            className="mt-4 inline-block text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
          >
            Sleep journal →
          </Link>
        </div>
      </div>

      {variant === "full" ? (
        <p className="text-xs text-gymsanity-700/90">
          Macro and recovery targets are coaching estimates from your profile—not medical advice. Adjust with
          your coach or clinician as needed.
        </p>
      ) : null}
    </section>
  );
}
