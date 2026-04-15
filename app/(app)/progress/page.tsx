import Link from "next/link";
import { redirect } from "next/navigation";
import { LoadProgressionPanel } from "@/components/LoadProgressionPanel";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getLoadHistoryGroupsForUser } from "@/lib/load-history";
import { defaultLoadWeightUnitFromOnboarding } from "@/lib/load-weight-display";
import { getActiveMembership } from "@/lib/membership";

export default async function MemberProgressPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getActiveMembership(session.sub);
  if (!membership?.plan.includesDigitalPrograms) {
    return (
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-gymsanity-950">Load progression</h1>
        <p className="mt-2 text-sm text-gymsanity-800/85">
          Your plan doesn&apos;t include the digital program library, so session loads aren&apos;t tracked here.
        </p>
        <Link href="/programs" className="mt-4 inline-block text-sm font-semibold text-gymsanity-800">
          ← Programs
        </Link>
      </div>
    );
  }

  const [groups, me] = await Promise.all([
    getLoadHistoryGroupsForUser(session.sub),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { onboardingProfile: true },
    }),
  ]);
  const defaultWeightUnit = defaultLoadWeightUnitFromOnboarding(me?.onboardingProfile);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Load progression</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Every time you save weight or reps on a completed strength set, it&apos;s recorded here. Use it to see
          how you&apos;re trending on each lift across programs and sessions—your coach sees the same history on
          your profile.
        </p>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">By exercise</h2>
        <div className="mt-4">
          <LoadProgressionPanel
            groups={groups}
            defaultWeightUnit={defaultWeightUnit}
            emptyMessage="No loads logged yet. Complete a strength set in a session, then enter weight and/or reps under that exercise."
          />
        </div>
      </div>
    </div>
  );
}
