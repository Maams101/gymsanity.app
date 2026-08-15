"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { MovementScreenResults } from "@/components/MovementScreenResults";
import type { CameraAssessment, OnboardingProfile } from "@/lib/onboarding-schema";
import { buildMovementScreen } from "@/lib/movement-screen";
import {
  evaluateScanFraming,
  hipMobilityFromMinKneeAngle,
  maxShoulderOpeningDeg,
  minKneeAngleDeg,
  overallMobility,
  shoulderMobilityFromAngle,
  type FramingResult,
} from "@/lib/onboarding-pose-metrics";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const RECORD_MS = 6000;
const COUNTDOWN_START = 3;
const HOLD_READY_MS = 2200;

async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const wasm = await FilesetResolver.forVisionTasks(WASM_BASE);
  try {
    return await PoseLandmarker.createFromOptions(wasm, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.35,
      minPosePresenceConfidence: 0.35,
      minTrackingConfidence: 0.35,
    });
  } catch {
    return PoseLandmarker.createFromOptions(wasm, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.35,
      minPosePresenceConfidence: 0.35,
      minTrackingConfidence: 0.35,
    });
  }
}

type Phase =
  | "idle"
  | "loading"
  | "preCountdown"
  | "align"
  | "moveCountdown"
  | "shoulder"
  | "squatPrep"
  | "squat"
  | "done";

type Props = {
  cameraAssessment: OnboardingProfile["cameraAssessment"];
  onPatch: (patch: Partial<Pick<OnboardingProfile, "cameraAssessment">>) => void;
};

const EMPTY_FRAME: FramingResult = evaluateScanFraming(undefined);

function BodyGuideSilhouette({ ready }: { ready: boolean }) {
  const stroke = ready ? "#22c55e" : "rgba(255,255,255,0.72)";
  return (
    <svg
      viewBox="0 0 120 200"
      className="pointer-events-none absolute inset-[8%] h-[84%] w-[84%] opacity-90"
      aria-hidden
    >
      <ellipse cx="60" cy="22" rx="14" ry="16" fill="none" stroke={stroke} strokeWidth="2.4" />
      <path
        d="M46 42c0 0 4 8 14 8s14-8 14-8l10 22-8 6-6-16v28l18 48-12 6-16-42-16 42-12-6 18-48V62l-6 16-8-6z"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect
        x="18"
        y="8"
        width="84"
        height="184"
        rx="18"
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeDasharray={ready ? "0" : "6 5"}
        opacity="0.85"
      />
    </svg>
  );
}

export function OnboardingCameraAssessment({
  cameraAssessment,
  onPatch,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const countdownRef = useRef<number>(0);
  const lastUiRef = useRef(0);
  const nextMoveRef = useRef<"shoulder" | "squat">("shoulder");
  const shoulderPeakRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const holdReadySinceRef = useRef(0);
  const startingMoveRef = useRef(false);

  const [disclaimer, setDisclaimer] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [framing, setFraming] = useState<FramingResult>(EMPTY_FRAME);
  const [holdMs, setHoldMs] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const stopLandmarker = useCallback(() => {
    stopLoop();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, [stopLoop]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (cameraAssessment) setDisclaimer(true);
  }, [cameraAssessment]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      stopLoop();
      stopStream();
      landmarkerRef.current?.close();
    };
  }, [stopLoop, stopStream]);

  async function ensureCamera() {
    setCamError(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
      audio: false,
    });
    streamRef.current = stream;
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      await v.play();
    }
  }

  async function ensureLandmarker() {
    if (landmarkerRef.current) return;
    setLoadError(null);
    landmarkerRef.current = await createPoseLandmarker();
  }

  function startCountdown(seconds: number, onDone: () => void) {
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    setCountdown(seconds);
    let left = seconds;
    countdownRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        if (countdownRef.current) window.clearInterval(countdownRef.current);
        countdownRef.current = 0;
        setCountdown(null);
        onDone();
        return;
      }
      setCountdown(left);
    }, 1000);
  }

  function startAlignLoop() {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (!video || !lm) return;
    stopLoop();
    holdReadySinceRef.current = 0;
    startingMoveRef.current = false;
    setHoldMs(0);

    const tick = () => {
      const t = performance.now();
      try {
        const res = lm.detectForVideo(video, t);
        if (t - lastUiRef.current > 80) {
          lastUiRef.current = t;
          const result = evaluateScanFraming(res.landmarks[0]);
          setFraming(result);
          const liningUp = phaseRef.current === "align" || phaseRef.current === "squatPrep";
          if (liningUp && result.ready && !startingMoveRef.current) {
            if (!holdReadySinceRef.current) holdReadySinceRef.current = t;
            const held = t - holdReadySinceRef.current;
            setHoldMs(held);
            if (held >= HOLD_READY_MS) {
              startingMoveRef.current = true;
              const kind = phaseRef.current === "squatPrep" ? "squat" : "shoulder";
              beginMovement(kind);
              return;
            }
          } else {
            holdReadySinceRef.current = 0;
            setHoldMs(0);
          }
        }
      } catch {
        /* video not ready yet */
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function runCapture(mode: "shoulder" | "squat", onDone: (value: number) => void) {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (!video || !lm) return;

    const start = performance.now();
    let peakShoulder = 0;
    let deepestKnee = 200;

    const tick = () => {
      const t = performance.now();
      setProgress(Math.min(1, (t - start) / RECORD_MS));
      const res = lm.detectForVideo(video, t);
      const pose = res.landmarks[0];
      if (pose) {
        if (mode === "shoulder") {
          const m = maxShoulderOpeningDeg(pose);
          if (Number.isFinite(m)) peakShoulder = Math.max(peakShoulder, m);
        } else {
          const k = minKneeAngleDeg(pose);
          if (Number.isFinite(k)) deepestKnee = Math.min(deepestKnee, k);
        }
      }
      if (t - start < RECORD_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        if (mode === "shoulder") onDone(peakShoulder);
        else onDone(deepestKnee);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function startFlow() {
    if (!disclaimer) return;
    onPatch({ cameraAssessment: undefined });
    setFraming(EMPTY_FRAME);
    setProgress(0);
    setPhase("loading");
    try {
      await ensureLandmarker();
    } catch (e) {
      console.error(e);
      setLoadError("Could not load movement analysis. Check your connection and try again.");
      setPhase("idle");
      return;
    }
    setPhase("preCountdown");
    startCountdown(COUNTDOWN_START, () => {
      void (async () => {
        try {
          await ensureCamera();
        } catch {
          setCamError(
            "Camera access was blocked or unavailable. Allow camera for this site and use HTTPS.",
          );
          setPhase("idle");
          return;
        }
        setPhase("align");
        startAlignLoop();
      })();
    });
  }

  function beginMovement(kind: "shoulder" | "squat") {
    const current = phaseRef.current;
    if (current !== "align" && current !== "squatPrep") return;
    nextMoveRef.current = kind;
    holdReadySinceRef.current = 0;
    setHoldMs(0);
    stopLoop();
    setPhase("moveCountdown");
    startCountdown(COUNTDOWN_START, () => {
      setProgress(0);
      if (kind === "shoulder") {
        setPhase("shoulder");
        runCapture("shoulder", (shoulderMax) => {
          shoulderPeakRef.current = shoulderMax;
          setProgress(0);
          setFraming(EMPTY_FRAME);
          setPhase("squatPrep");
          startAlignLoop();
        });
      } else {
        setPhase("squat");
        runCapture("squat", (squatMinKnee) => {
          finishAssessment(shoulderPeakRef.current, squatMinKnee);
        });
      }
    });
  }

  function finishAssessment(shoulderMax: number, squatMinKnee: number) {
    const shoulderMob = shoulderMobilityFromAngle(shoulderMax);
    const hipMob = hipMobilityFromMinKneeAngle(squatMinKnee);
    const overall = overallMobility(shoulderMob, hipMob);
    const movementScreen = buildMovementScreen(shoulderMax, squatMinKnee, shoulderMob, hipMob);

    const samplesOk =
      Number.isFinite(shoulderMax) && shoulderMax > 15 && Number.isFinite(squatMinKnee) && squatMinKnee < 195;
    const poseConfidence = samplesOk ? "medium" : "low";

    const assessment: CameraAssessment = {
      completedAt: new Date().toISOString(),
      disclaimersAccepted: true,
      mobility: {
        shoulderOpeningMaxDeg: Math.round(shoulderMax * 10) / 10,
        squatMinKneeDeg: Math.round(squatMinKnee * 10) / 10,
        shoulderMobility: shoulderMob,
        hipMobility: hipMob,
        overallMobility: overall,
      },
      movementScreen,
      poseConfidence,
    };
    onPatch({ cameraAssessment: assessment });
    stopStream();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setPhase("done");
  }

  function resetFlow() {
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = 0;
    setCountdown(null);
    stopLandmarker();
    stopStream();
    onPatch({ cameraAssessment: undefined });
    setProgress(0);
    setFraming(EMPTY_FRAME);
    setHoldMs(0);
    holdReadySinceRef.current = 0;
    startingMoveRef.current = false;
    setPhase("idle");
  }

  const option =
    "flex cursor-pointer items-center gap-2 rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-900 hover:border-gymsanity-400 has-[:checked]:border-gymsanity-600 has-[:checked]:ring-1 has-[:checked]:ring-gymsanity-500";

  const showResults = cameraAssessment && (phase === "done" || phase === "idle");
  const cameraLive = phase === "align" || phase === "squatPrep" || phase === "shoulder" || phase === "squat";
  const aligning = phase === "align" || phase === "squatPrep";
  const capturing = phase === "shoulder" || phase === "squat";
  const counting = phase === "preCountdown" || phase === "moveCountdown" || phase === "loading";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-gymsanity-950">Movement screen</h2>
        <p className="mt-1 text-sm text-gymsanity-800/85">
          This is a short functional movement check from what the camera can see: overhead shoulder reach and a
          deep squat. We score each pattern 1–3 the way a movement screen does (3 = the pattern looked clear). We
          do not estimate body fat, BMR, or muscle mass from this video — those numbers cannot be read from a
          phone camera.
        </p>
      </div>

      <label className={`${option} max-w-prose`}>
        <input
          type="checkbox"
          checked={disclaimer}
          onChange={(e) => setDisclaimer(e.target.checked)}
          className="rounded text-gymsanity-700"
        />
        <span>
          I understand this is a coaching movement snapshot, not a medical diagnosis or a certified FMS, and I
          consent to processing pose data from my device for this onboarding step only.
        </span>
      </label>

      {phase === "idle" && !showResults && (
        <ol className="space-y-3 rounded-2xl border border-gymsanity-100 bg-white/85 p-4 text-sm text-gymsanity-900">
          <p className="font-semibold text-gymsanity-950">How to stand for the movement screen</p>
          {[
            "Place your phone or laptop on a stable surface at about hip to chest height — not in your hand.",
            "Stand 6–8 feet (about 2–2.5 meters) back so your whole body fits in the outline.",
            "Face the camera straight on, feet about hip-width, arms relaxed at your sides.",
            "Use even front lighting. Avoid strong backlight from a window behind you.",
            "Wear fitted clothes so shoulders, hips, and knees are easy to see.",
            "Hold the green light still for a couple of seconds. Recording starts on its own — you do not need to walk back to the device.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gymsanity-100 text-xs font-semibold text-gymsanity-800">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {(loadError || camError) && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {loadError || camError}
        </p>
      )}

      <div
        className={`relative mx-auto aspect-[3/4] w-full max-w-sm max-h-[min(56vh,460px)] overflow-hidden rounded-2xl border-2 bg-black/90 transition-colors ${
          aligning && framing.ready
            ? "border-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.35)]"
            : "border-gymsanity-200"
        }`}
      >
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${cameraLive ? "opacity-100" : "opacity-0"}`}
          playsInline
          muted
          autoPlay
        />
        {aligning ? <BodyGuideSilhouette ready={framing.ready} /> : null}

        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2">
          <span
            className={`h-3.5 w-3.5 rounded-full ring-2 ring-white/70 ${
              aligning && framing.ready
                ? "bg-green-400 shadow-[0_0_12px_rgba(34,197,94,0.95)]"
                : cameraLive
                  ? "bg-amber-400"
                  : "bg-neutral-500"
            }`}
            aria-hidden
          />
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            {aligning && framing.ready ? "Ready" : cameraLive ? "Line up" : "Camera off"}
          </span>
        </div>

        {aligning && framing.ready ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center px-4 text-center">
            <div className="relative mb-2 h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(1, holdMs / HOLD_READY_MS) * 94.2} 94.2`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                {Math.max(1, Math.ceil((HOLD_READY_MS - holdMs) / 1000))}
              </span>
            </div>
            <p className="rounded-full bg-green-600/90 px-3 py-1 text-sm font-semibold text-white shadow-lg">
              Hold still — starting automatically
            </p>
          </div>
        ) : null}

        {counting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-4 text-center text-white">
            {phase === "loading" ? (
              <p className="text-sm">Preparing the scan…</p>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  {phase === "preCountdown" ? "Camera goes live in" : "Recording starts in"}
                </p>
                <p className="mt-2 font-display text-7xl font-semibold leading-none">{countdown ?? 1}</p>
                <p className="mt-3 max-w-[16rem] text-sm text-white/85">
                  {phase === "preCountdown"
                    ? "Get into position. You can adjust after the camera turns on."
                    : nextMoveRef.current === "shoulder"
                      ? "Raise one arm out and overhead when recording starts. Keep your ribs down."
                      : "Feet shoulder-width, heels down if you can. Squat as deep as you safely can."}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {aligning && (
        <div className="space-y-3">
          <ul className="space-y-1.5 text-sm">
            {framing.hints.map((h) => (
              <li key={h.id} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    h.ok ? "bg-green-500" : "bg-gymsanity-300"
                  }`}
                >
                  {h.ok ? "✓" : ""}
                </span>
                <span className={h.ok ? "text-green-800" : "text-gymsanity-800"}>{h.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-gymsanity-800">
            {framing.ready
              ? "Green light is on. Stay still — the next step starts automatically."
              : "Match the outline. Stay in the green light; you do not need to come back to tap anything."}
          </p>
        </div>
      )}

      {capturing && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gymsanity-200">
            <div
              className="h-full bg-gymsanity-600 transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-center text-sm font-medium text-gymsanity-900">
            {phase === "shoulder"
              ? "Raise one arm out to the side and overhead as far as you can without shrugging. Hold the end range."
              : "Feet about shoulder-width, heels down if you can, chest tall. Squat as deep as you safely can, pause, then stand."}
          </p>
        </div>
      )}

      {phase === "idle" && !showResults && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!disclaimer}
            onClick={() => void startFlow()}
            className="rounded-full bg-gymsanity-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-50"
          >
            I’m ready — countdown then camera
          </button>
        </div>
      )}

      {showResults && (
        <div className="space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 text-sm text-gymsanity-900">
          <h3 className="font-semibold text-gymsanity-950">Your movement screen</h3>
          <MovementScreenResults assessment={cameraAssessment} />
          {cameraAssessment.poseConfidence === "low" ? (
            <p className="text-xs text-amber-900/90">
              Pose confidence was low — stand farther from the camera, light your body from the front, and try
              Re-scan if the squat or reach looks off.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void resetFlow()}
              className="rounded-full border border-gymsanity-300 px-5 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              Re-scan
            </button>
            {phase === "idle" ? (
              <span className="self-center text-xs text-gymsanity-600">Saved to your profile for this step.</span>
            ) : null}
          </div>
        </div>
      )}

      {phase === "idle" && !cameraAssessment && (
        <p className="text-xs text-gymsanity-600">Complete the scan to continue.</p>
      )}
    </section>
  );
}
