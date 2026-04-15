/** Map a coach-provided URL to something we can embed in-session. */

export type ExerciseVideoEmbed =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "direct"; src: string }
  | { kind: "link"; href: string };

function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "www.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.slice("/embed/".length).split("/")[0] || null;
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.slice("/shorts/".length).split("/")[0] || null;
      }
      const v = u.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (host === "player.vimeo.com" && parts[0]) return parts[0];
    const videoIdx = parts.indexOf("video");
    if (videoIdx >= 0 && parts[videoIdx + 1]) return parts[videoIdx + 1];
    const id = parts.find((p) => /^\d+$/.test(p));
    return id ?? null;
  } catch {
    return null;
  }
}

export function resolveExerciseVideoEmbed(pageUrl: string): ExerciseVideoEmbed {
  const trimmed = pageUrl.trim();
  if (!trimmed) return { kind: "link", href: pageUrl };

  const yt = youtubeVideoId(trimmed);
  if (yt) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0`,
    };
  }

  const vm = vimeoVideoId(trimmed);
  if (vm) {
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(vm)}`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(trimmed)) {
    return { kind: "direct", src: trimmed };
  }

  return { kind: "link", href: trimmed };
}
