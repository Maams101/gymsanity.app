"use client";

import { useCallback, useEffect, useState } from "react";
import type { SleepAdviceSection } from "@/lib/sleep-advice";

const AUTO_MS = 10000;

type Props = {
  sections: SleepAdviceSection[];
};

export function SleepAdviceSlideshow({ sections }: Props) {
  const [index, setIndex] = useState(0);
  const n = sections.length;

  const go = useCallback(
    (i: number) => {
      setIndex(((i % n) + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [n]);

  const s = sections[index];

  return (
    <div className="rounded-xl border border-gymsanity-200/90 bg-white/70 p-5 shadow-inner shadow-gymsanity-950/5">
      <div className="flex items-start justify-between gap-2 border-b border-gymsanity-100 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gymsanity-600">
          Slide {index + 1} of {n}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="rounded-full border border-gymsanity-200 bg-white px-2 py-1 text-xs font-semibold text-gymsanity-800 shadow-sm transition hover:border-gymsanity-300 hover:bg-gymsanity-50"
            aria-label="Previous tip"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="rounded-full border border-gymsanity-200 bg-white px-2 py-1 text-xs font-semibold text-gymsanity-800 shadow-sm transition hover:border-gymsanity-300 hover:bg-gymsanity-50"
            aria-label="Next tip"
          >
            →
          </button>
        </div>
      </div>

      <div
        key={index}
        className="motion-safe:animate-fitness-rule-in motion-reduce:animate-none min-h-[16rem] pt-4 md:min-h-[14rem]"
        role="region"
        aria-live="polite"
        aria-label={`Sleep tip: ${s.title}`}
      >
        <h3 className="font-display text-lg font-semibold leading-snug text-gymsanity-950">{s.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gymsanity-800/95">{s.summary}</p>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-gymsanity-900/85">
          {s.bullets.map((b, i) => (
            <li key={`${index}-${i}`}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-gymsanity-100 pt-4">
        {sections.map((sec, i) => (
          <button
            key={sec.title}
            type="button"
            aria-label={`Show: ${sec.title}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-gymsanity-600" : "w-2 bg-gymsanity-300 hover:bg-gymsanity-400"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-gymsanity-600/90">
        Tips advance every {AUTO_MS / 1000}s — use arrows or dots anytime.
      </p>
    </div>
  );
}
