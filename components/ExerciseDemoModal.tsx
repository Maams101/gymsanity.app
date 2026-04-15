"use client";

import { resolveExerciseVideoEmbed } from "@/lib/exercise-video-embed";
import { useCallback, useEffect, useId } from "react";

export function ExerciseDemoModal({
  open,
  title,
  videoUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  videoUrl: string;
  onClose: () => void;
}) {
  const titleId = useId();

  const embed = resolveExerciseVideoEmbed(videoUrl);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close demo"
        className="absolute inset-0 bg-gymsanity-950/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-3xl overflow-hidden rounded-2xl border border-gymsanity-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gymsanity-100 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="font-display text-lg font-semibold text-gymsanity-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-gymsanity-700 hover:bg-gymsanity-100"
          >
            Close
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {embed.kind === "youtube" || embed.kind === "vimeo" ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                title={`${title} demo`}
                src={embed.embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : embed.kind === "direct" ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                controls
                playsInline
                className="h-full w-full"
                src={embed.src}
              >
                <a href={embed.src} className="text-white underline">
                  Open video
                </a>
              </video>
            </div>
          ) : (
            <p className="text-sm text-gymsanity-800">
              This link can&apos;t be embedded here.{" "}
              <a
                href={embed.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gymsanity-800 underline hover:text-gymsanity-950"
              >
                Open demo in a new tab →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
