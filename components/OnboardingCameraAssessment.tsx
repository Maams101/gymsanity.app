"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraAssessment, OnboardingProfile } from "@/lib/onboarding-schema";
import {
  bodyMassIndex,
  clampBodyFatPercent,
  deurenbergBodyFatPercent,
  estimatedSkeletalMuscleMassKg,
  leanBodyMassKg,
  mifflinStJeorBmr,
} from "@/lib/bmr-body-composition";
import {
  hipMobilityFromMinKneeAngle,
  maxShoulderOpeningDeg,
  minKneeAngleDeg,
  overallMobility,
  shoulderMobilityFromAngle,
} from "@/lib/onboarding-pose-metrics";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const RECORD_MS = 6000;

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

type Phase = "idle" | "loading" | "shoulder" | "squat" | "done";

type Props = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sexForMetrics: OnboardingProfile["sexForMetrics"];
  cameraAssessment: OnboardingProfile["cameraAssessment"];
  onPatch: (patch: Partial<Pick<OnboardingProfile, "sexForMetrics" | "cameraAssessment">>) => void;
};

export function OnboardingCameraAssessment({
  heightCm,
  weightKg,
  ageYears,
  sexForMetrics,
  cameraAssessment,
  onPatch,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  const [disclaimer, setDisclaimer] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopLandmarker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  useEffect(() => {
    if (cameraAssessment) setDisclaimer(true);
  }, [cameraAssessment]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopStream();
      landmarkerRef.current?.close();
    };
  }, [stopStream]);

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
    setPhase("loading");
    try {
      landmarkerRef.current = await createPoseLandmarker();
      setPhase("idle");
    } catch (e) {
      console.error(e);
      setLoadError("Could not load movement analysis. Check your connection and try again.");
      setPhase("idle");
      throw e;
    }
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
    if (!disclaimer || !sexForMetrics) return;
    onPatch({ cameraAssessment: undefined });
    try {
      await ensureCamera();
    } catch {
      setCamError("Camera access was blocked or unavailable. Allow camera for this site and use HTTPS.");
      setPhase("idle");
      return;
    }
    try {
      await ensureLandmarker();
    } catch {
      stopStream();
      setPhase("idle");
      return;
    }
    setPhase("shoulder");
    runCapture("shoulder", (shoulderMax) => {
      setPhase("squat");
      runCapture("squat", (squatMinKnee) => {
        finishAssessment(shoulderMax, squatMinKnee);
      });
    });
  }

  function finishAssessment(shoulderMax: number, squatMinKnee: number) {
    const sex = sexForMetrics ?? "prefer_not";
    const bmr = Math.round(mifflinStJeorBmr(weightKg, heightCm, ageYears, sex));
    const bmi = bodyMassIndex(weightKg, heightCm);
    const bfRaw = deurenbergBodyFatPercent(bmi, ageYears, sex);
    const bf = clampBodyFatPercent(bfRaw);
    const lbm = leanBodyMassKg(weightKg, bf);
    const smm = estimatedSkeletalMuscleMassKg(lbm, sex);

    const shoulderMob = shoulderMobilityFromAngle(shoulderMax);
    const hipMob = hipMobilityFromMinKneeAngle(squatMinKnee);
    const overall = overallMobility(shoulderMob, hipMob);

    const samplesOk =
      Number.isFinite(shoulderMax) && shoulderMax > 15 && Number.isFinite(squatMinKnee) && squatMinKnee < 195;
    const poseConfidence = samplesOk ? "medium" : "low";

    const assessment: CameraAssessment = {
      completedAt: new Date().toISOString(),
      disclaimersAccepted: true,
      bmrKcal: bmr,
      bodyFatPercentEstimate: Math.round(bf * 10) / 10,
      bodyFatMethod: "deurenberg_bmi",
      leanMassKg: Math.round(lbm * 10) / 10,
      skeletalMuscleMassEstimateKg: Math.round(smm * 10) / 10,
      muscleMassMethod: "lbm_sex_partition",
      mobility: {
        shoulderOpeningMaxDeg: Math.round(shoulderMax * 10) / 10,
        squatMinKneeDeg: Math.round(squatMinKnee * 10) / 10,
        shoulderMobility: shoulderMob,
        hipMobility: hipMob,
        overallMobility: overall,
      },
      poseConfidence,
    };
    onPatch({ cameraAssessment: assessment });
    stopStream();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setPhase("done");
  }

  function resetFlow() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    stopLandmarker();
    stopStream();
    onPatch({ cameraAssessment: undefined });
    setProgress(0);
    setPhase("idle");
  }

  const label = "text-sm font-medium text-gymsanity-900";
  const option =
    "flex cursor-pointer items-center gap-2 rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-900 hover:border-gymsanity-400 has-[:checked]:border-gymsanity-600 has-[:checked]:ring-1 has-[:checked]:ring-gymsanity-500";

  const showResults = cameraAssessment && (phase === "done" || phase === "idle");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-gymsanity-950">Metabolism & movement</h2>
        <p className="mt-1 text-sm text-gymsanity-800/85">
          We use your camera for a short movement check (shoulder reach + squat depth).           BMR, body-fat %, lean mass, and muscle-mass estimates come from your height, weight, age, and sex using
          published formulas—not a medical scan. Muscle numbers partition lean mass by typical sex averages, not
          your limbs on camera. Results are approximate and for coaching context only.
        </p>
      </div>

      <fieldset>
        <legend className={label}>Sex (for BMR & body-composition formulas)</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(
            [
              ["male", "Male"],
              ["female", "Female"],
              ["prefer_not", "Prefer not to say"],
            ] as const
          ).map(([k, text]) => (
            <label key={k} className={option}>
              <input
                type="radio"
                name="sex-metrics"
                checked={sexForMetrics === k}
                onChange={() => onPatch({ sexForMetrics: k })}
                className="text-gymsanity-700"
              />
              {text}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={`${option} max-w-prose`}>
        <input
          type="checkbox"
          checked={disclaimer}
          onChange={(e) => setDisclaimer(e.target.checked)}
          className="rounded text-gymsanity-700"
        />
        <span>
          I understand these are estimates, not medical diagnosis, and I consent to processing pose data from my
          device for this onboarding step only.
        </span>
      </label>

      {(loadError || camError) && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {loadError || camError}
        </p>
      )}

      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm max-h-[min(52vh,420px)] overflow-hidden rounded-2xl border border-gymsanity-200 bg-black/90">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
        {phase === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white/95">
            Loading movement model…
          </div>
        )}
      </div>

      {(phase === "shoulder" || phase === "squat") && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gymsanity-200">
            <div
              className="h-full bg-gymsanity-600 transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-center text-sm font-medium text-gymsanity-900">
            {phase === "shoulder"
              ? "Raise one arm out to the side and overhead as far as comfortable—hold the end range."
              : "Squat as deep as you safely can, pause briefly, then stand."}
          </p>
        </div>
      )}

      {phase === "idle" && !showResults && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!disclaimer || !sexForMetrics}
            onClick={() => void startFlow()}
            className="rounded-full bg-gymsanity-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-50"
          >
            Allow camera & start scan
          </button>
        </div>
      )}

      {showResults && (
        <div className="space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-4 text-sm text-gymsanity-900">
          <h3 className="font-semibold text-gymsanity-950">Results (approximate)</h3>
          <ul className="list-inside list-disc space-y-1 text-gymsanity-800">
            <li>
              <strong>Basal metabolic rate:</strong> ~{cameraAssessment.bmrKcal} kcal/day (Mifflin–St Jeor)
            </li>
            <li>
              <strong>Body fat (estimate):</strong> ~{cameraAssessment.bodyFatPercentEstimate}% (BMI + age + sex;
              not DXA)
            </li>
            {cameraAssessment.leanMassKg != null ? (
              <li>
                <strong>Lean mass (estimate):</strong> ~{cameraAssessment.leanMassKg} kg (from weight and body-fat
                estimate)
              </li>
            ) : null}
            {cameraAssessment.skeletalMuscleMassEstimateKg != null ? (
              <li>
                <strong>Skeletal muscle (estimate):</strong> ~{cameraAssessment.skeletalMuscleMassEstimateKg} kg
                (partition of lean mass; not limb-by-limb imaging)
              </li>
            ) : null}
            <li>
              <strong>Shoulder mobility:</strong> {cameraAssessment.mobility.shoulderMobility} (peak reach ~
              {cameraAssessment.mobility.shoulderOpeningMaxDeg}°)
            </li>
            <li>
              <strong>Hip / squat depth:</strong> {cameraAssessment.mobility.hipMobility} (deepest knee angle ~
              {cameraAssessment.mobility.squatMinKneeDeg}°)
            </li>
            <li>
              <strong>Overall movement:</strong> {cameraAssessment.mobility.overallMobility}
            </li>
          </ul>
          {cameraAssessment.poseConfidence === "low" ? (
            <p className="text-xs text-amber-900/90">
              Pose confidence was low—stand farther from the camera, light your body from the front, and try Re-scan
              if these numbers look off.
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
