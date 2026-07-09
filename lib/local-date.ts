/** Calendar date as YYYY-MM-DD in the runtime's local timezone. */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localDayBounds(d = new Date()): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

export function yesterdayDateKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return localDateKey(y);
}

export function formatLocalDateLong(d = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
