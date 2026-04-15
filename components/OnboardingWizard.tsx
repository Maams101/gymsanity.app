"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatBiomarkerSummaryLine } from "@/lib/biomarker-format";
import {
  onboardingBiomarkerFieldLabels,
  onboardingLabels,
  onboardingProfileSchema,
  resolveMeasurementSystem,
  type OnboardingProfile,
} from "@/lib/onboarding-schema";
import {
  cmToInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  roundWeightDisplay,
  splitFeetInches,
} from "@/lib/units";

const initial: OnboardingProfile = {
  heightCm: undefined,
  weightKg: undefined,
  weightDisplayUnit: "kg",
  measurementSystem: "metric",
  ageYears: undefined,
  trainingExperience: "beginner",
  sessionsPerWeek: "1-2",
  equipmentAccess: [],
  primaryGoals: [],
  goalDetails: "",
  targetTimeline: "3mo",
  sleepHours: "7-8",
  stressLevel: "moderate",
  recoveryPractices: [],
  healthConditions: "",
  medicationsSupplements: "",
  injuryLimitations: "",
  clearedByPhysician: "not_sure",
};

const STEPS = 6;

function toggle<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingProfile>(initial);
  const [weightField, setWeightField] = useState("");
  const [heightFtField, setHeightFtField] = useState("");
  const [heightInField, setHeightInField] = useState("");
  const prevStepRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const imperial = resolveMeasurementSystem(data) === "imperial";

  useEffect(() => {
    const prev = prevStepRef.current;
    if (step === 0 && prev !== null && prev !== 0) {
      const sys = resolveMeasurementSystem(data);
      setWeightField(
        data.weightKg == null
          ? ""
          : String(roundWeightDisplay(sys === "imperial" ? kgToLbs(data.weightKg) : data.weightKg))
      );
      if (sys === "imperial" && data.heightCm != null) {
        const { feet, inches } = splitFeetInches(cmToInches(data.heightCm));
        setHeightFtField(String(feet));
        setHeightInField(Number.isInteger(inches) ? String(inches) : inches.toFixed(1));
      } else {
        setHeightFtField("");
        setHeightInField("");
      }
    }
    prevStepRef.current = step;
    // Intentionally sync from `data` only when returning to step 0 (not on every data edit).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see prevStepRef guard above
  }, [step, data.weightKg, data.heightCm, data.measurementSystem, data.weightDisplayUnit]);

  function validateStep(s: number): string | null {
    switch (s) {
      case 0:
        if (data.heightCm == null || Number.isNaN(data.heightCm))
          return imperial
            ? "Enter your height in feet and inches (e.g. 5 ft 10 in)."
            : `Enter ${onboardingBiomarkerFieldLabels.heightCm.toLowerCase()} (e.g. 175).`;
        if (data.heightCm < 120 || data.heightCm > 230) {
          return imperial
            ? "Height should be between about 3′ 11″ and 7′ 7″."
            : "Height should be between 120 and 230 cm.";
        }
        if (data.weightKg == null || Number.isNaN(data.weightKg))
          return `Enter ${onboardingBiomarkerFieldLabels.weight.toLowerCase()} (${
            imperial ? "e.g. 170" : "e.g. 72"
          }).`;
        if (data.weightKg < 40 || data.weightKg > 220) {
          return imperial
            ? "Weight should be between about 88 and 485 lbs."
            : "Weight should be between 40 and 220 kg.";
        }
        if (data.ageYears == null || Number.isNaN(data.ageYears))
          return `Enter ${onboardingBiomarkerFieldLabels.ageYears.toLowerCase()}.`;
        if (data.ageYears < 16 || data.ageYears > 100) return "Age should be between 16 and 100.";
        return null;
      case 1:
        if (data.equipmentAccess.length === 0) return "Choose at least one training environment or equipment option.";
        return null;
      case 2:
        if (data.primaryGoals.length === 0) return "Select at least one goal.";
        return null;
      case 3:
        if (data.recoveryPractices.length === 0) return "Select at least one recovery or rest practice (or “None right now”).";
        return null;
      case 4:
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((x) => Math.min(x + 1, STEPS - 1));
  }

  function back() {
    setError(null);
    setStep((x) => Math.max(x - 1, 0));
  }

  async function submit() {
    const sys = resolveMeasurementSystem(data);
    const payload: OnboardingProfile = {
      ...data,
      measurementSystem: data.measurementSystem ?? sys,
      weightDisplayUnit: sys === "imperial" ? "lbs" : "kg",
    };
    const parsed = onboardingProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please review your answers and try again.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/me/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not save. Try again.");
      return;
    }
    router.push("/subscribe");
    router.refresh();
  }

  const label = "text-sm font-medium text-gymsanity-900";
  const option =
    "flex cursor-pointer items-center gap-2 rounded-xl border border-gymsanity-200 bg-white px-3 py-2 text-sm text-gymsanity-900 hover:border-gymsanity-400 has-[:checked]:border-gymsanity-600 has-[:checked]:ring-1 has-[:checked]:ring-gymsanity-500";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex gap-1">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gymsanity-600" : "bg-gymsanity-200"}`}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">{error}</p>
      )}

      {step === 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">About you</h2>
            <p className="mt-1 text-sm text-gymsanity-800/85">
              Height, weight, and age help us contextualize load and recovery—they stay private to you and your coach.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className={label}>{onboardingBiomarkerFieldLabels.measurementSystem}</span>
            <div
              className="inline-flex w-fit rounded-full border border-gymsanity-200 bg-gymsanity-50/80 p-0.5 text-xs font-semibold"
              role="group"
              aria-label="Measurement system"
            >
              <button
                type="button"
                onClick={() => {
                  setData((d) => {
                    setWeightField(
                      d.weightKg == null ? "" : String(roundWeightDisplay(d.weightKg))
                    );
                    setHeightFtField("");
                    setHeightInField("");
                    return {
                      ...d,
                      measurementSystem: "metric",
                      weightDisplayUnit: "kg",
                    };
                  });
                }}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  !imperial ? "bg-white text-gymsanity-950 shadow-sm" : "text-gymsanity-700 hover:text-gymsanity-950"
                }`}
              >
                Metric (cm, kg)
              </button>
              <button
                type="button"
                onClick={() => {
                  setData((d) => {
                    setWeightField(
                      d.weightKg == null
                        ? ""
                        : String(roundWeightDisplay(kgToLbs(d.weightKg)))
                    );
                    if (d.heightCm != null) {
                      const { feet, inches } = splitFeetInches(cmToInches(d.heightCm));
                      setHeightFtField(String(feet));
                      setHeightInField(
                        Number.isInteger(inches) ? String(inches) : inches.toFixed(1)
                      );
                    } else {
                      setHeightFtField("");
                      setHeightInField("");
                    }
                    return {
                      ...d,
                      measurementSystem: "imperial",
                      weightDisplayUnit: "lbs",
                    };
                  });
                }}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  imperial ? "bg-white text-gymsanity-950 shadow-sm" : "text-gymsanity-700 hover:text-gymsanity-950"
                }`}
              >
                Imperial (ft / in, lbs)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              {imperial ? (
                <label className={`${label} flex min-h-[2.75rem] items-end`}>
                  {onboardingBiomarkerFieldLabels.heightImperial}
                </label>
              ) : (
                <label htmlFor="onboarding-height-cm" className={`${label} flex min-h-[2.75rem] items-end`}>
                  {onboardingBiomarkerFieldLabels.heightCm}
                </label>
              )}
              {imperial ? (
                <div
                  className="flex min-h-[2.75rem] items-stretch gap-1.5"
                  role="group"
                  aria-label="Height in feet and inches"
                >
                  <input
                    id="onboarding-height-ft"
                    type="number"
                    inputMode="numeric"
                    min={3}
                    max={8}
                    step={1}
                    value={heightFtField}
                    onChange={(e) => {
                      const ftStr = e.target.value;
                      setHeightFtField(ftStr);
                      const ft = ftStr === "" ? NaN : Number(ftStr);
                      const inch = heightInField === "" || heightInField === "." ? 0 : Number(heightInField);
                      if (ftStr === "" || Number.isNaN(ft)) {
                        setData((d) => ({ ...d, heightCm: undefined }));
                        return;
                      }
                      if (Number.isNaN(inch)) {
                        setData((d) => ({ ...d, heightCm: undefined }));
                        return;
                      }
                      setData((d) => ({ ...d, heightCm: feetInchesToCm(ft, inch) }));
                    }}
                    className="min-h-[2.75rem] min-w-0 flex-1 rounded-xl border border-gymsanity-200 px-2 py-2 text-center text-gymsanity-950"
                    placeholder="ft"
                    aria-label="Feet"
                  />
                  <span
                    className="flex shrink-0 items-center text-sm font-medium text-gymsanity-500"
                    aria-hidden
                  >
                    ′
                  </span>
                  <input
                    id="onboarding-height-in"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={11.9}
                    step={0.1}
                    value={heightInField}
                    onChange={(e) => {
                      const inStr = e.target.value;
                      setHeightInField(inStr);
                      const ft = heightFtField === "" ? NaN : Number(heightFtField);
                      const inch = inStr === "" || inStr === "." ? 0 : Number(inStr);
                      if (heightFtField === "" || Number.isNaN(ft)) {
                        if (inStr === "") setData((d) => ({ ...d, heightCm: undefined }));
                        return;
                      }
                      if (inStr !== "" && inStr !== "." && Number.isNaN(inch)) return;
                      setData((d) => ({ ...d, heightCm: feetInchesToCm(ft, inch) }));
                    }}
                    className="min-h-[2.75rem] min-w-0 flex-1 rounded-xl border border-gymsanity-200 px-2 py-2 text-center text-gymsanity-950"
                    placeholder="in"
                    aria-label="Inches"
                  />
                  <span
                    className="flex shrink-0 items-center text-sm font-medium text-gymsanity-500"
                    aria-hidden
                  >
                    ″
                  </span>
                </div>
              ) : (
                <input
                  id="onboarding-height-cm"
                  aria-label={onboardingBiomarkerFieldLabels.heightCm}
                  type="number"
                  inputMode="decimal"
                  min={120}
                  max={230}
                  step={1}
                  value={data.heightCm ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setData((d) => ({
                      ...d,
                      heightCm: v === "" ? undefined : Number(v),
                    }));
                  }}
                  className="w-full min-h-[2.75rem] rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
                  placeholder="175"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="onboarding-weight" className={`${label} flex min-h-[2.75rem] items-end`}>
                {imperial
                  ? onboardingBiomarkerFieldLabels.weightLbs
                  : onboardingBiomarkerFieldLabels.weightKg}
              </label>
              <input
                id="onboarding-weight"
                aria-label={
                  imperial
                    ? onboardingBiomarkerFieldLabels.weightLbs
                    : onboardingBiomarkerFieldLabels.weightKg
                }
                type="number"
                inputMode="decimal"
                min={imperial ? 88 : 40}
                max={imperial ? 485 : 220}
                step={imperial ? 0.5 : 0.1}
                value={weightField}
                onChange={(e) => {
                  const v = e.target.value;
                  setWeightField(v);
                  if (v === "" || v === ".") {
                    setData((d) => ({ ...d, weightKg: undefined }));
                    return;
                  }
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  const kg = imperial ? lbsToKg(n) : n;
                  setData((d) => ({ ...d, weightKg: kg }));
                }}
                className="w-full min-h-[2.75rem] rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
                placeholder={imperial ? "170" : "72"}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="onboarding-age" className={`${label} flex min-h-[2.75rem] items-end`}>
                {onboardingBiomarkerFieldLabels.ageYears}
              </label>
              <input
                id="onboarding-age"
                aria-label={onboardingBiomarkerFieldLabels.ageYears}
                type="number"
                inputMode="numeric"
                min={16}
                max={100}
                value={data.ageYears ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setData((d) => ({
                    ...d,
                    ageYears: v === "" ? undefined : Number(v),
                  }));
                }}
                className="w-full min-h-[2.75rem] rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
                placeholder="32"
              />
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">Training background</h2>
            <p className="mt-1 text-sm text-gymsanity-800/85">
              Honest baselines help us meet you where you are—not where social media says you should be.
            </p>
          </div>
          <fieldset>
            <legend className={label}>Experience level</legend>
            <div className="mt-2 grid gap-2">
              {(Object.keys(onboardingLabels.trainingExperience) as Array<keyof typeof onboardingLabels.trainingExperience>).map(
                (k) => (
                  <label key={k} className={option}>
                    <input
                      type="radio"
                      name="exp"
                      checked={data.trainingExperience === k}
                      onChange={() => setData((d) => ({ ...d, trainingExperience: k }))}
                      className="text-gymsanity-700"
                    />
                    {onboardingLabels.trainingExperience[k]}
                  </label>
                )
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>How many sessions per week feel realistic right now?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(Object.keys(onboardingLabels.sessionsPerWeek) as Array<keyof typeof onboardingLabels.sessionsPerWeek>).map(
                (k) => (
                  <label key={k} className={option}>
                    <input
                      type="radio"
                      name="sess"
                      checked={data.sessionsPerWeek === k}
                      onChange={() => setData((d) => ({ ...d, sessionsPerWeek: k }))}
                      className="text-gymsanity-700"
                    />
                    {onboardingLabels.sessionsPerWeek[k]}
                  </label>
                )
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>What do you have access to? (choose all that apply)</legend>
            <div className="mt-2 grid gap-2">
              {(Object.keys(onboardingLabels.equipmentAccess) as Array<keyof typeof onboardingLabels.equipmentAccess>).map(
                (k) => (
                  <label key={k} className={option}>
                    <input
                      type="checkbox"
                      checked={data.equipmentAccess.includes(k)}
                      onChange={() =>
                        setData((d) => ({
                          ...d,
                          equipmentAccess: toggle(d.equipmentAccess, k),
                        }))
                      }
                      className="rounded text-gymsanity-700"
                    />
                    {onboardingLabels.equipmentAccess[k]}
                  </label>
                )
              )}
            </div>
          </fieldset>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">Goals</h2>
            <p className="mt-1 text-sm text-gymsanity-800/85">
              What would “winning the next season” look like for you? Pick everything that matters.
            </p>
          </div>
          <fieldset>
            <legend className={label}>Primary goals</legend>
            <div className="mt-2 grid gap-2">
              {(Object.keys(onboardingLabels.primaryGoals) as Array<keyof typeof onboardingLabels.primaryGoals>).map((k) => (
                <label key={k} className={option}>
                  <input
                    type="checkbox"
                    checked={data.primaryGoals.includes(k)}
                    onChange={() =>
                      setData((d) => ({
                        ...d,
                        primaryGoals: toggle(d.primaryGoals, k),
                      }))
                    }
                    className="rounded text-gymsanity-700"
                  />
                  {onboardingLabels.primaryGoals[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>How soon do you want meaningful progress?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(Object.keys(onboardingLabels.targetTimeline) as Array<keyof typeof onboardingLabels.targetTimeline>).map(
                (k) => (
                  <label key={k} className={option}>
                    <input
                      type="radio"
                      name="tl"
                      checked={data.targetTimeline === k}
                      onChange={() => setData((d) => ({ ...d, targetTimeline: k }))}
                      className="text-gymsanity-700"
                    />
                    {onboardingLabels.targetTimeline[k]}
                  </label>
                )
              )}
            </div>
          </fieldset>
          <label className={label}>
            Anything else we should know about your goals? (optional)
            <textarea
              value={data.goalDetails}
              onChange={(e) => setData((d) => ({ ...d, goalDetails: e.target.value }))}
              rows={4}
              placeholder="Events, life season, non-negotiables…"
              className="mt-2 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm text-gymsanity-950 outline-none ring-gymsanity-400 focus:ring-2"
            />
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">Habits & recovery</h2>
            <p className="mt-1 text-sm text-gymsanity-800/85">
              Training doesn’t work in a vacuum—sleep and stress shape what you can absorb.
            </p>
          </div>
          <fieldset>
            <legend className={label}>Typical sleep on most nights</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(Object.keys(onboardingLabels.sleepHours) as Array<keyof typeof onboardingLabels.sleepHours>).map((k) => (
                <label key={k} className={option}>
                  <input
                    type="radio"
                    name="sleep"
                    checked={data.sleepHours === k}
                    onChange={() => setData((d) => ({ ...d, sleepHours: k }))}
                    className="text-gymsanity-700"
                  />
                  {onboardingLabels.sleepHours[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Stress load lately</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(Object.keys(onboardingLabels.stressLevel) as Array<keyof typeof onboardingLabels.stressLevel>).map((k) => (
                <label key={k} className={option}>
                  <input
                    type="radio"
                    name="stress"
                    checked={data.stressLevel === k}
                    onChange={() => setData((d) => ({ ...d, stressLevel: k }))}
                    className="text-gymsanity-700"
                  />
                  {onboardingLabels.stressLevel[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>What do you lean on for recovery? (choose all that apply)</legend>
            <div className="mt-2 grid gap-2">
              {(Object.keys(onboardingLabels.recoveryPractices) as Array<
                keyof typeof onboardingLabels.recoveryPractices
              >).map((k) => (
                <label key={k} className={option}>
                  <input
                    type="checkbox"
                    checked={data.recoveryPractices.includes(k)}
                    onChange={() =>
                      setData((d) => ({
                        ...d,
                        recoveryPractices: toggle(d.recoveryPractices, k),
                      }))
                    }
                    className="rounded text-gymsanity-700"
                  />
                  {onboardingLabels.recoveryPractices[k]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">Health & safety</h2>
            <p className="mt-1 text-sm text-gymsanity-800/85">
              This helps your coach program safely. You can update this anytime with your coach.
            </p>
          </div>
          <label className={label}>
            Health conditions or diagnoses we should be aware of (optional)
            <textarea
              value={data.healthConditions ?? ""}
              onChange={(e) => setData((d) => ({ ...d, healthConditions: e.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm"
            />
          </label>
          <label className={label}>
            Medications or supplements (optional)
            <textarea
              value={data.medicationsSupplements ?? ""}
              onChange={(e) => setData((d) => ({ ...d, medicationsSupplements: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm"
            />
          </label>
          <label className={label}>
            Current or recent injuries / limitations (optional)
            <textarea
              value={data.injuryLimitations ?? ""}
              onChange={(e) => setData((d) => ({ ...d, injuryLimitations: e.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-sm"
            />
          </label>
          <fieldset>
            <legend className={label}>Has a physician cleared you for exercise or said you’re safe to train?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(Object.keys(onboardingLabels.clearedByPhysician) as Array<
                keyof typeof onboardingLabels.clearedByPhysician
              >).map((k) => (
                <label key={k} className={option}>
                  <input
                    type="radio"
                    name="md"
                    checked={data.clearedByPhysician === k}
                    onChange={() => setData((d) => ({ ...d, clearedByPhysician: k }))}
                    className="text-gymsanity-700"
                  />
                  {onboardingLabels.clearedByPhysician[k]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4 text-sm text-gymsanity-900">
          <h2 className="font-display text-xl font-semibold text-gymsanity-950">Review</h2>
          <p className="text-gymsanity-800/85">
            When you continue, we’ll save this to your profile. You can always refine it with your coach.
          </p>
          <dl className="space-y-3 rounded-2xl border border-gymsanity-100 bg-white/90 p-4">
            {data.heightCm != null && data.weightKg != null && data.ageYears != null ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Biological markers</dt>
                <dd>{formatBiomarkerSummaryLine(data)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Experience</dt>
              <dd>{onboardingLabels.trainingExperience[data.trainingExperience]}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Frequency</dt>
              <dd>{onboardingLabels.sessionsPerWeek[data.sessionsPerWeek]}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Equipment</dt>
              <dd>{data.equipmentAccess.map((k) => onboardingLabels.equipmentAccess[k]).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Goals</dt>
              <dd>{data.primaryGoals.map((k) => onboardingLabels.primaryGoals[k]).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Timeline</dt>
              <dd>{onboardingLabels.targetTimeline[data.targetTimeline]}</dd>
            </div>
            {data.goalDetails?.trim() ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Goal notes</dt>
                <dd className="whitespace-pre-wrap">{data.goalDetails}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Sleep & stress</dt>
              <dd>
                {onboardingLabels.sleepHours[data.sleepHours]} · {onboardingLabels.stressLevel[data.stressLevel]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Recovery</dt>
              <dd>{data.recoveryPractices.map((k) => onboardingLabels.recoveryPractices[k]).join(", ")}</dd>
            </div>
            {(data.healthConditions?.trim() ||
              data.medicationsSupplements?.trim() ||
              data.injuryLimitations?.trim()) && (
              <>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Health</dt>
                  <dd className="whitespace-pre-wrap">{data.healthConditions || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Meds / supplements</dt>
                  <dd className="whitespace-pre-wrap">{data.medicationsSupplements || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Injuries</dt>
                  <dd className="whitespace-pre-wrap">{data.injuryLimitations || "—"}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Physician clearance</dt>
              <dd>{onboardingLabels.clearedByPhysician[data.clearedByPhysician]}</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || loading}
          className="rounded-full border border-gymsanity-200 px-5 py-2.5 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-gymsanity-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="rounded-full bg-gymsanity-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Finish & choose plan"}
          </button>
        )}
      </div>
    </div>
  );
}
