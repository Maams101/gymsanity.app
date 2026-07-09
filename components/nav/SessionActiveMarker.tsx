"use client";

import { useEffect } from "react";
import { markActiveSession } from "@/components/nav/SessionResumeHint";

export function SessionActiveMarker({ dayId, title }: { dayId: string; title: string }) {
  useEffect(() => {
    markActiveSession(dayId, title);
  }, [dayId, title]);
  return null;
}
