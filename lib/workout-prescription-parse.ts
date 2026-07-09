/** First target rep count from strings like "3 × 8–10" or "4 x 12". */
export function parseTargetReps(prescription: string): number | null {
  const m = prescription.match(/[×x]\s*(\d+)(?:\s*[–-]\s*\d+)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Rest duration in seconds from free-text prescription, if present. */
export function parseRestSeconds(prescription: string): number | null {
  const lower = prescription.toLowerCase();

  const minMatch = lower.match(/(?:rest|between sets)[^\d]*(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?|m\b)/);
  if (minMatch) {
    const sec = Math.round(Number(minMatch[1]) * 60);
    if (sec >= 15 && sec <= 600) return sec;
  }

  const secMatch = lower.match(/(?:rest|between sets)[^\d]*(\d+)\s*(?:s(?:ec(?:ond)?s?)?)?\b/);
  if (secMatch) {
    const sec = Number(secMatch[1]);
    if (sec >= 15 && sec <= 600) return sec;
  }

  const trailingSec = lower.match(/(\d+)\s*s(?:ec(?:ond)?s?)?\s*rest\b/);
  if (trailingSec) {
    const sec = Number(trailingSec[1]);
    if (sec >= 15 && sec <= 600) return sec;
  }

  const clock = lower.match(/rest[^\d]*(\d+)\s*:\s*(\d{1,2})\b/);
  if (clock) {
    const sec = Number(clock[1]) * 60 + Number(clock[2]);
    if (sec >= 15 && sec <= 600) return sec;
  }

  return null;
}

export function formatRestDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Live countdown display — always M:SS (e.g. 1:30 → 0:05). */
export function formatCountdown(totalSec: number): string {
  const clamped = Math.max(0, totalSec);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
