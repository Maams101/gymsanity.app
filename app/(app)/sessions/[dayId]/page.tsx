import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";
import { CompleteSessionButton } from "@/components/CompleteSessionButton";
import { SessionActiveMarker } from "@/components/nav/SessionActiveMarker";
import { WorkoutSessionTracker } from "@/components/WorkoutSessionTracker";
import { defaultLoadWeightUnitFromOnboarding } from "@/lib/load-weight-display";

type Props = { params: Promise<{ dayId: string }> };

export default async function SessionPage({ params }: Props) {
  const { dayId } = await params;
  const session = await getSession();
  if (!session) return null;

  const membership = await getActiveMembership(session.sub);
  if (!membership?.plan.includesDigitalPrograms) {
    return (
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6">
        <p className="text-gymsanity-900">Your plan doesn&apos;t include digital programming.</p>
        <Link href="/programs" className="mt-4 inline-block text-sm font-semibold text-gymsanity-800">
          ← Programs
        </Link>
      </div>
    );
  }

  const day = await prisma.programDay.findFirst({
    where: { id: dayId, program: prismaWherePublishedProgramForMember(session.sub) },
    include: {
      program: true,
      exercises: { orderBy: { sortOrder: "asc" }, include: { exercise: true } },
      completions: { where: { userId: session.sub } },
    },
  });

  if (!day) notFound();

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { onboardingProfile: true },
  });
  const defaultWeightUnit = defaultLoadWeightUnitFromOnboarding(me?.onboardingProfile);

  const setLogs = await prisma.exerciseSetLog.findMany({
    where: {
      userId: session.sub,
      exerciseLineId: { in: day.exercises.map((e) => e.id) },
    },
  });
  const initialCompleted: Record<string, number[]> = {};
  const initialLoad: Record<string, Record<number, { weightKg: number | null; reps: number | null }>> = {};
  for (const log of setLogs) {
    (initialCompleted[log.exerciseLineId] ??= []).push(log.setIndex);
    (initialLoad[log.exerciseLineId] ??= {})[log.setIndex] = {
      weightKg: log.weightKg,
      reps: log.reps,
    };
  }

  const completed = day.completions[0];

  return (
    <div className="space-y-8">
      <SessionActiveMarker dayId={day.id} title={day.title} />
      <div>
        <Link
          href={`/programs/${day.program.id}`}
          className="text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
        >
          ← {day.program.title}
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-gymsanity-950">{day.title}</h1>
        {day.focusNote && <p className="mt-2 text-gymsanity-900/75">{day.focusNote}</p>}
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Session</h2>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          Count reps with the +/− counter, then tap Complete set—a recovery countdown starts automatically
          between sets. For strength work, log weight in kg or lbs; entries show on your{" "}
          <Link href="/progress" className="font-semibold text-gymsanity-900 underline hover:text-gymsanity-950">
            Load progression
          </Link>{" "}
          page and for your coach. When you&apos;re done with the full session, add a reflection and mark complete
          below—that logs your accountability streak.
        </p>
        <div className="mt-6">
          <WorkoutSessionTracker
            key={day.id}
            defaultWeightUnit={defaultWeightUnit}
            initialCompleted={initialCompleted}
            initialLoad={initialLoad}
            lines={day.exercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              prescription: ex.prescription,
              section: ex.section,
              setCount: ex.setCount,
              cues: ex.exercise?.cues ?? null,
              videoUrl: ex.exercise?.videoUrl ?? null,
            }))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
          Check in (optional)
        </h2>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          A line about energy, stress, or breath—whatever helps you stay honest without judgment.
        </p>
        <CompleteSessionButton
          programDayId={day.id}
          initialNote={completed?.note ?? ""}
          initiallyComplete={!!completed}
        />
      </div>
    </div>
  );
}
