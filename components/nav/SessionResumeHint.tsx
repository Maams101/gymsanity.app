"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ActiveSession = { dayId: string; title: string };

/** Prompt to return to an in-progress workout when navigating away from the session page. */
export function SessionResumeHint() {
  const pathname = usePathname();
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/sessions/")) {
      setSession(null);
      return;
    }
    try {
      const raw = sessionStorage.getItem("gymsanity-active-session");
      if (!raw) {
        setSession(null);
        return;
      }
      setSession(JSON.parse(raw) as ActiveSession);
    } catch {
      setSession(null);
    }
  }, [pathname]);

  if (!session?.dayId) return null;

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Resume training</p>
          <p className="text-sm font-medium text-emerald-950">{session.title}</p>
        </div>
        <Link
          href={`/sessions/${session.dayId}`}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Continue session
        </Link>
      </div>
    </div>
  );
}

export function markActiveSession(dayId: string, title: string) {
  try {
    sessionStorage.setItem(
      "gymsanity-active-session",
      JSON.stringify({ dayId, title } satisfies ActiveSession)
    );
  } catch {
    /* ignore */
  }
}

export function clearActiveSession() {
  try {
    sessionStorage.removeItem("gymsanity-active-session");
  } catch {
    /* ignore */
  }
}
