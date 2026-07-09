"use client";

import { useEffect, useRef, useState } from "react";

export type RestTimerState = {
  endsAt: number;
  totalSec: number;
  label: string;
  lineId: string;
  setIndex: number;
};

export function useRestCountdown(timer: RestTimerState | null) {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!timer) {
      setRemainingSec(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      setRemainingSec(left);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [timer]);

  const isRunning = timer != null && remainingSec > 0;
  const isFinished = timer != null && remainingSec === 0;
  const progress =
    timer != null && timer.totalSec > 0 ? remainingSec / timer.totalSec : 0;

  return { remainingSec, isRunning, isFinished, progress };
}

/** Fire `onComplete` once when countdown hits zero. */
export function useRestCountdownComplete(
  timer: RestTimerState | null,
  remainingSec: number,
  onComplete: () => void
) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!timer) {
      firedRef.current = null;
      return;
    }
    const key = `${timer.lineId}-${timer.setIndex}-${timer.endsAt}`;
    if (remainingSec === 0 && firedRef.current !== key) {
      firedRef.current = key;
      onComplete();
    }
  }, [timer, remainingSec, onComplete]);
}
