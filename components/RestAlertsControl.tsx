"use client";

import { useEffect, useState } from "react";
import {
  canUseRestNotifications,
  requestRestNotificationPermission,
  restAlertsEnabled,
  restNotificationPermission,
} from "@/lib/rest-timer-notify";

export function RestAlertsControl() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(restNotificationPermission());
    setEnabled(restAlertsEnabled());
  }, []);

  if (!canUseRestNotifications()) return null;
  if (permission === "denied") {
    return (
      <p className="text-xs text-gymsanity-700">
        Rest chime plays when the timer ends. Enable notifications in your browser settings for alerts when
        the app is in the background.
      </p>
    );
  }

  if (permission === "granted" && enabled) {
    return (
      <p className="text-xs font-medium text-emerald-800">
        Rest alerts on — you&apos;ll get a notification when the timer ends.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void requestRestNotificationPermission().then((ok) => {
          setPermission(restNotificationPermission());
          setEnabled(ok || restAlertsEnabled());
          setBusy(false);
        });
      }}
      className="rounded-full border border-gymsanity-300 bg-white px-3 py-1.5 text-xs font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-60"
    >
      {busy ? "Enabling…" : "Enable rest notifications"}
    </button>
  );
}
