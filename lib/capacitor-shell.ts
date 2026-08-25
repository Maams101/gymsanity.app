/**
 * Detect whether the page is running inside the Capacitor native WebView.
 * Safe on the server (always false) and in browsers without Capacitor.
 */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    }
  ).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function getCapacitorPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    }
  ).Capacitor;
  if (!cap?.isNativePlatform?.()) return "web";
  const p = cap.getPlatform?.();
  if (p === "ios" || p === "android") return p;
  return "web";
}
