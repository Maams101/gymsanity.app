"use client";

const REST_ALERTS_KEY = "gymsanity-rest-alerts";
let titleFlashInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle = typeof document !== "undefined" ? document.title : "";

export function restAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(REST_ALERTS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRestAlertsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(REST_ALERTS_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function canUseRestNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function restNotificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseRestNotifications()) return "unsupported";
  return Notification.permission;
}

export async function requestRestNotificationPermission(): Promise<boolean> {
  if (!canUseRestNotifications()) return false;
  if (Notification.permission === "granted") {
    setRestAlertsEnabled(true);
    return true;
  }
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  const granted = result === "granted";
  if (granted) setRestAlertsEnabled(true);
  return granted;
}

function stopTitleFlash() {
  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }
  if (typeof document !== "undefined") document.title = originalTitle;
}

function flashTitle(message: string) {
  if (typeof document === "undefined" || !document.hidden) return;
  stopTitleFlash();
  originalTitle = document.title;
  let on = true;
  titleFlashInterval = setInterval(() => {
    document.title = on ? message : originalTitle;
    on = !on;
  }, 800);
  window.setTimeout(stopTitleFlash, 8000);
}

export function playRestCompleteChime() {
  try {
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : null;
    if (!Ctx) return;
    const ctx = new Ctx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    const t = ctx.currentTime;
    playTone(880, t, 0.15);
    playTone(1175, t + 0.18, 0.2);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* ignore */
  }
}

function tryVibrate() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([180, 80, 180, 80, 240]);
    }
  } catch {
    /* ignore */
  }
}

/** Alert the member that rest is over — sound, vibration, optional push notification. */
export function notifyRestComplete(label: string) {
  playRestCompleteChime();
  tryVibrate();

  const body = label.trim() || "Time for your next set.";
  flashTitle("Rest complete — next set!");

  if (canUseRestNotifications() && Notification.permission === "granted" && restAlertsEnabled()) {
    try {
      const n = new Notification("Rest complete", {
        body,
        tag: "gymsanity-rest-timer",
        icon: "/icons/apple-touch-icon.png",
      });
      n.onclick = () => {
        window.focus();
        n.close();
        stopTitleFlash();
      };
    } catch {
      /* ignore */
    }
  }
}

export function dismissRestAlerts() {
  stopTitleFlash();
}
