import Link from "next/link";
import { DayAtAGlancePanel } from "@/components/DayAtAGlancePanel";
import { WorkoutOfDayChallenge } from "@/components/WorkoutOfDayChallenge";
import { ManageBillingButton, SubscribeCheckoutButton } from "@/components/StripeActions";
import { prisma } from "@/lib/db";
import { getDayAtAGlance } from "@/lib/day-at-a-glance";
import { getSession } from "@/lib/get-session";
import { getActiveMembership, getCreditBalance, getPendingMembership } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

export default async function TodayPage() {
  const session = await getSession();
  if (!session) return null;

  const dayAtAGlance = await getDayAtAGlance(session.sub);
  const membership = await getActiveMembership(session.sub);
  const pending = await getPendingMembership(session.sub);
  const credits = await getCreditBalance(session.sub);

  const userRow = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { stripeCustomerId: true, loyaltyStreak: true, name: true },
  });

  let nextSession: { id: string; title: string; programTitle: string } | null = null;
  if (membership?.plan.includesDigitalPrograms) {
    const programs = await prisma.program.findMany({
      where: prismaWherePublishedProgramForMember(session.sub),
      orderBy: { sortOrder: "asc" },
      include: {
        days: {
          orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
          include: { completions: { where: { userId: session.sub } } },
        },
      },
    });
    outer: for (const p of programs) {
      for (const d of p.days) {
        if (d.completions.length === 0) {
          nextSession = { id: d.id, title: d.title, programTitle: p.title };
          break outer;
        }
      }
    }
  }

  const upcoming = await prisma.booking.findMany({
    where: { userId: session.sub, status: "BOOKED" },
    orderBy: { slot: { startAt: "asc" } },
    take: 3,
    include: { slot: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Today</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">
          Hey{userRow?.name ? `, ${userRow.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-sm text-gymsanity-900/75">{dayAtAGlance.dateLabel}</p>
      </div>

      {pending && pending.plan.stripePriceId && !membership && (
        <div className="rounded-2xl border border-gymsanity-200 bg-gymsanity-50/90 p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-gymsanity-950">Finish setup</h2>
          <p className="mt-2 text-sm text-gymsanity-900/80">Complete checkout to unlock training.</p>
          <div className="mt-4">
            <SubscribeCheckoutButton />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gymsanity-200 bg-gradient-to-br from-gymsanity-50 to-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Streak</p>
          <p className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">
            {userRow?.loyaltyStreak ?? 0}
            <span className="text-base font-medium text-gymsanity-600">/11</span>
          </p>
        </div>
        <div className="rounded-2xl border border-gymsanity-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">1:1 credits</p>
          <p className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">{credits}</p>
        </div>
        <Link
          href="/book"
          className="rounded-2xl border border-gymsanity-200 bg-white/90 p-4 shadow-sm transition hover:border-gymsanity-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-600">Next booking</p>
          <p className="mt-1 text-sm font-medium text-gymsanity-950">
            {upcoming[0]
              ? new Date(upcoming[0].slot.startAt).toLocaleString(undefined, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Nothing booked"}
          </p>
        </Link>
      </div>

      {nextSession ? (
        <div className="rounded-2xl border border-gymsanity-700/20 bg-gymsanity-700 p-6 text-white shadow-lg shadow-gymsanity-900/15">
          <p className="text-xs font-semibold uppercase tracking-wide text-gymsanity-200">Start workout</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{nextSession.title}</h2>
          <p className="mt-1 text-sm text-gymsanity-100/90">{nextSession.programTitle}</p>
          <Link
            href={`/sessions/${nextSession.id}`}
            className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gymsanity-800 hover:bg-gymsanity-50"
          >
            Start session
          </Link>
        </div>
      ) : null}

      {dayAtAGlance.coachWorkoutOfDay ? (
        <div id="coach-wod">
          <WorkoutOfDayChallenge wod={dayAtAGlance.coachWorkoutOfDay} variant="card" />
        </div>
      ) : null}

      <DayAtAGlancePanel data={dayAtAGlance} variant="compact" />

      {membership && userRow?.stripeCustomerId ? (
        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-4">
          <ManageBillingButton />
        </div>
      ) : null}
    </div>
  );
}

export async function generateMetadata() {
  return { title: "Today — Gymsanity" };
}
