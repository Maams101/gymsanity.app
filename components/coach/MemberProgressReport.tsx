import { LoadProgressionTable } from "@/components/LoadProgressionTable";
import { CoachMemberNutritionForm } from "@/components/coach/CoachMemberNutritionForm";
import { MemberOnboardingSummary } from "@/components/coach/MemberOnboardingSummary";
import { getLoadHistoryGroupsForUser } from "@/lib/load-history";
import { defaultLoadWeightUnitFromOnboarding } from "@/lib/load-weight-display";
import type { Prisma } from "@prisma/client";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export type MemberProgressPayload = Prisma.UserGetPayload<{
  include: {
    memberNutritionPlan: true;
    completions: {
      include: {
        programDay: {
          include: { program: true };
        };
      };
    };
  };
}>;

export async function MemberProgressReport({ member }: { member: MemberProgressPayload }) {
  const loadGroups = await getLoadHistoryGroupsForUser(member.id);
  const coachViewWeightUnit = defaultLoadWeightUnitFromOnboarding(member.onboardingProfile);
  const completedCount = member.completions.length;
  const lastActivity = member.completions[0]?.completedAt ?? null;
  const recentWithNotes = member.completions.filter((c) => c.note).slice(0, 5);

  return (
    <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-gymsanity-950">{member.name}</h2>
          <p className="text-sm text-gymsanity-800/80">{member.email}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
          <dt className="text-gymsanity-700/80">Sessions completed</dt>
          <dd className="font-semibold text-gymsanity-950">{completedCount}</dd>
          <dt className="text-gymsanity-700/80">Accountability streak</dt>
          <dd className="font-semibold text-gymsanity-950">{member.loyaltyStreak} / 11</dd>
          <dt className="text-gymsanity-700/80">Last activity</dt>
          <dd className="font-semibold text-gymsanity-950">{formatDate(lastActivity)}</dd>
        </dl>
      </div>

      <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
          Onboarding profile
        </h3>
        <MemberOnboardingSummary profile={member.onboardingProfile} />
      </div>

      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
          Nutrition (member app)
        </h3>
        <p className="mt-1 text-xs text-gymsanity-800/85">
          They see goal-based playbooks from onboarding plus whatever you save here on{" "}
          <span className="font-medium text-gymsanity-900">Nutrition</span>.
        </p>
        <CoachMemberNutritionForm
          memberId={member.id}
          initialNotes={member.memberNutritionPlan?.coachNotes ?? ""}
        />
      </div>

      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/35 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
          Load progression
        </h3>
        <p className="mt-1 text-xs text-gymsanity-800/85">
          Logged when they save weight or reps on completed strength sets. Shown in their preferred unit (
          {coachViewWeightUnit}) from onboarding; values are stored in kg.
        </p>
        <div className="mt-3">
          <LoadProgressionTable
            groups={loadGroups}
            weightUnit={coachViewWeightUnit}
            emptyMessage="No load entries yet. When they log weight or reps during a program session, history appears here."
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gymsanity-100 bg-gymsanity-50/50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Recent sessions
          </h3>
          {member.completions.length === 0 ? (
            <p className="mt-2 text-sm text-gymsanity-800">No completions yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {member.completions.slice(0, 5).map((completion) => (
                <li key={completion.id} className="text-gymsanity-900/85">
                  <span className="font-medium text-gymsanity-950">
                    {completion.programDay.title}
                  </span>{" "}
                  · {completion.programDay.program.title}
                  <span className="ml-2 text-xs text-gymsanity-700/80">
                    {formatDate(completion.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gymsanity-100 bg-gymsanity-50/50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Reflection notes
          </h3>
          {recentWithNotes.length === 0 ? (
            <p className="mt-2 text-sm text-gymsanity-800">No notes submitted yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentWithNotes.map((completion) => (
                <li key={completion.id} className="rounded-lg bg-white p-3 text-sm">
                  <p className="font-medium text-gymsanity-900">{completion.programDay.title}</p>
                  <p className="mt-1 text-gymsanity-900/85">{completion.note}</p>
                  <p className="mt-1 text-xs text-gymsanity-700/80">
                    {formatDate(completion.completedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
