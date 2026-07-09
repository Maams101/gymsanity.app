import { formatBiomarkerSummaryLine } from "@/lib/biomarker-format";
import { onboardingLabels, onboardingProfileSchema } from "@/lib/onboarding-schema";

export function MemberOnboardingSummary({ profile }: { profile: unknown }) {
  const parsed = onboardingProfileSchema.safeParse(profile);
  if (!parsed.success) {
    return <p className="text-sm text-gymsanity-800">Onboarding not completed yet.</p>;
  }
  const d = parsed.data;
  return (
    <dl className="mt-2 grid gap-2 text-sm text-gymsanity-900/90">
      {d.heightCm != null && d.weightKg != null && d.ageYears != null ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Biological markers</dt>
          <dd>{formatBiomarkerSummaryLine(d)}</dd>
        </div>
      ) : null}
      {d.cameraAssessment ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
            Metabolic & movement (camera)
          </dt>
          <dd>
            BMR ~{d.cameraAssessment.bmrKcal} kcal/day · est. BF {d.cameraAssessment.bodyFatPercentEstimate}%
            {d.cameraAssessment.leanMassKg != null &&
            d.cameraAssessment.skeletalMuscleMassEstimateKg != null ? (
              <>
                {" "}
                · lean ~{d.cameraAssessment.leanMassKg} kg · est. muscle ~{d.cameraAssessment.skeletalMuscleMassEstimateKg}{" "}
                kg
              </>
            ) : null}{" "}
            · shoulder {d.cameraAssessment.mobility.shoulderMobility} · squat / hip{" "}
            {d.cameraAssessment.mobility.hipMobility} · overall {d.cameraAssessment.mobility.overallMobility}
          </dd>
        </div>
      ) : null}
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Training</dt>
        <dd>
          {onboardingLabels.trainingExperience[d.trainingExperience]} ·{" "}
          {onboardingLabels.sessionsPerWeek[d.sessionsPerWeek]} ·{" "}
          {d.equipmentAccess.map((k) => onboardingLabels.equipmentAccess[k]).join(", ")}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Goals</dt>
        <dd>{d.primaryGoals.map((k) => onboardingLabels.primaryGoals[k]).join(", ")}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Habits</dt>
        <dd>
          Sleep: {onboardingLabels.sleepHours[d.sleepHours]} · Stress:{" "}
          {onboardingLabels.stressLevel[d.stressLevel]} · Recovery:{" "}
          {d.recoveryPractices.map((k) => onboardingLabels.recoveryPractices[k]).join(", ")}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Health</dt>
        <dd className="space-y-1">
          <span>
            Physician clearance: {onboardingLabels.clearedByPhysician[d.clearedByPhysician]}
          </span>
          {d.healthConditions?.trim() ? (
            <span className="block text-gymsanity-800/90">Conditions: {d.healthConditions}</span>
          ) : null}
          {d.injuryLimitations?.trim() ? (
            <span className="block text-gymsanity-800/90">Injuries: {d.injuryLimitations}</span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}
