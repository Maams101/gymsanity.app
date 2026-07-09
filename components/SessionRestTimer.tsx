"use client";

import { formatCountdown, formatRestDuration } from "@/lib/workout-prescription-parse";
import { useRestCountdown, useRestCountdownComplete, type RestTimerState } from "@/lib/use-rest-countdown";

export type { RestTimerState };

type Props = {
  timer: RestTimerState | null;
  onSkip: () => void;
  onAddSeconds: (delta: number) => void;
  onRestart: (seconds: number) => void;
  onComplete: () => void;
  variant?: "bar" | "inline";
};

const PRESETS = [60, 90, 120, 180] as const;

function tryVibrate() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    /* ignore */
  }
}

export function SessionRestTimer({
  timer,
  onSkip,
  onAddSeconds,
  onRestart,
  onComplete,
  variant = "bar",
}: Props) {
  const { remainingSec, isRunning, isFinished, progress } = useRestCountdown(timer);

  const handleComplete = () => {
    tryVibrate();
    onComplete();
  };

  useRestCountdownComplete(timer, remainingSec, handleComplete);

  if (!timer) return null;

  if (variant === "inline") {
    return (
      <div
        className={`rounded-xl border px-4 py-5 text-center ${
          isFinished
            ? "border-emerald-300 bg-emerald-50"
            : "border-gymsanity-300 bg-gymsanity-100/80"
        }`}
        role="timer"
        aria-live="polite"
        aria-label={`Recovery rest: ${remainingSec} seconds remaining`}
      >
        {isFinished ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Rest complete</p>
            <p className="mt-2 font-display text-2xl font-semibold text-emerald-950">Next set</p>
            <button
              type="button"
              onClick={onSkip}
              className="mt-3 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Start set
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-700">
              Recovery rest · Set {timer.setIndex}
            </p>
            <p
              className={`mt-2 font-display text-5xl font-semibold tabular-nums tracking-tight text-gymsanity-950 ${
                isRunning && remainingSec <= 10 ? "animate-pulse" : ""
              }`}
            >
              {formatCountdown(remainingSec)}
            </p>
            <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-gymsanity-200">
              <div
                className="h-full bg-gymsanity-600 transition-[width] duration-300 ease-linear"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onAddSeconds(30)}
                className="rounded-full border border-gymsanity-300 bg-white px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full bg-gymsanity-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gymsanity-800"
              >
                Skip rest
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm ${
        isFinished
          ? "border-emerald-300 bg-emerald-50/95"
          : "border-gymsanity-200 bg-white/95"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Recovery rest: ${remainingSec} seconds remaining`}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isFinished ? "text-emerald-800" : "text-gymsanity-600"
              }`}
            >
              {isFinished ? "Rest complete" : "Recovery rest"}
            </p>
            <p className="truncate text-sm text-gymsanity-900">{timer.label}</p>
          </div>
          <p
            className={`font-display text-4xl font-semibold tabular-nums tracking-tight ${
              isFinished ? "text-emerald-950" : "text-gymsanity-950"
            } ${isRunning && remainingSec <= 10 ? "animate-pulse" : ""}`}
          >
            {isFinished ? "Go!" : formatCountdown(remainingSec)}
          </p>
        </div>

        {!isFinished ? (
          <div className="h-2 overflow-hidden rounded-full bg-gymsanity-200">
            <div
              className="h-full bg-gymsanity-600 transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {isFinished ? (
            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
            >
              Start next set
            </button>
          ) : (
            <>
              {PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onRestart(sec)}
                  className="rounded-full border border-gymsanity-300 px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
                >
                  {formatRestDuration(sec)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onAddSeconds(30)}
                className="rounded-full border border-gymsanity-300 px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="ml-auto rounded-full bg-gymsanity-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gymsanity-800"
              >
                Skip rest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
