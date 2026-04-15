"use client";

import { useCallback, useEffect, useState } from "react";

const RULES = [
  {
    headline: "Your body, your rules",
    body: "One size doesn't fit all—so stop copying and start creating.",
  },
  {
    headline: "Motion > emotion",
    body: "Move your body, change your brain.",
  },
  {
    headline: "Action > motivation",
    body: "Action creates motivation—not the other way around.",
  },
] as const;

const ROTATE_MS = 8500;

export function FitnessRules() {
  const [index, setIndex] = useState(0);

  const go = useCallback((next: number) => {
    setIndex(((next % RULES.length) + RULES.length) % RULES.length);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % RULES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const rule = RULES[index];

  return (
    <section
      className="w-full max-w-2xl"
      aria-labelledby="fitness-rules-title"
      aria-live="polite"
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-gymsanity-700">
        Fitness Rules
      </p>
      <h2 id="fitness-rules-title" className="sr-only">
        Fitness Rules — one principle at a time
      </h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/55 bg-white/75 p-6 shadow-lg shadow-gymsanity-950/10 backdrop-blur-md md:p-8">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gymsanity-600">
            Rule {index + 1} of {RULES.length}
          </p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="rounded-full border border-gymsanity-200/80 bg-white/90 px-2.5 py-1 text-sm font-medium text-gymsanity-800 shadow-sm transition hover:border-gymsanity-300 hover:bg-white"
              aria-label="Previous rule"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="rounded-full border border-gymsanity-200/80 bg-white/90 px-2.5 py-1 text-sm font-medium text-gymsanity-800 shadow-sm transition hover:border-gymsanity-300 hover:bg-white"
              aria-label="Next rule"
            >
              →
            </button>
          </div>
        </div>

        <div
          key={index}
          className="motion-safe:animate-fitness-rule-in motion-reduce:animate-none mt-5 min-h-[5.5rem] md:min-h-[5rem]"
        >
          <div className="border-l-[3px] border-gymsanity-500/80 pl-4">
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight text-gymsanity-950 md:text-[1.65rem]">
              {rule.headline}
            </p>
            <p className="mt-3 text-base leading-relaxed text-gymsanity-900/80 md:text-[1.05rem]">
              {rule.body}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Choose a rule">
          {RULES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show rule ${i + 1}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-gymsanity-700"
                  : "w-2 bg-gymsanity-300/80 hover:bg-gymsanity-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
