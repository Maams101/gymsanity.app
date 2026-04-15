import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership, getCreditBalance, getPendingMembership } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";
import { ManageBillingButton, SubscribeCheckoutButton } from "@/components/StripeActions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const membership = await getActiveMembership(session.sub);
  const pending = await getPendingMembership(session.sub);
  const credits = await getCreditBalance(session.sub);
  const userRow = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { stripeCustomerId: true, loyaltyStreak: true },
  });

  const upcoming = await prisma.booking.findMany({
    where: { userId: session.sub, status: "BOOKED" },
    orderBy: { slot: { startAt: "asc" } },
    take: 5,
    include: { slot: true },
  });

  let nextDay: { id: string; title: string; program: { title: string } } | null = null;
  if (membership?.plan.includesDigitalPrograms) {
    const programs = await prisma.program.findMany({
      where: prismaWherePublishedProgramForMember(session.sub),
      orderBy: { sortOrder: "asc" },
      include: {
        days: {
          orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
          include: {
            completions: { where: { userId: session.sub } },
          },
        },
      },
    });
    outer: for (const p of programs) {
      for (const d of p.days) {
        if (d.completions.length === 0) {
          nextDay = { id: d.id, title: d.title, program: { title: p.title } };
          break outer;
        }
      }
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Your rhythm</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Consistency over intensity. Pick up where you left off—programs, bookings, and credits in
          one place.
        </p>
      </div>

      {pending && pending.plan.stripePriceId && !membership && (
        <div className="rounded-2xl border border-gymsanity-200 bg-gymsanity-50/90 p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-gymsanity-950">
            {pending.plan.billingType === "ONE_TIME"
              ? `Complete purchase — ${pending.plan.name}`
              : `Finish subscribing — ${pending.plan.name}`}
          </h2>
          <p className="mt-2 text-sm text-gymsanity-900/80">
            {pending.plan.billingType === "ONE_TIME"
              ? "Your account is ready. Pay once to unlock the app and add your session credits."
              : "Your account is ready. Complete secure checkout to activate programming and booking access."}
          </p>
          <div className="mt-4">
            <SubscribeCheckoutButton />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm md:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            {membership?.plan.billingType === "ONE_TIME" ? "Your pack" : "Membership"}
          </h2>
          {membership ? (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold text-gymsanity-950">{membership.plan.name}</p>
              <p className="text-sm text-gymsanity-900/70">{membership.plan.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gymsanity-800/70">
                  {membership.plan.billingType === "ONE_TIME" ? "Session credits" : "1:1 credits"}
                </dt>
                <dd className="font-medium text-gymsanity-950">{credits}</dd>
                <dt className="text-gymsanity-800/70">Group</dt>
                <dd className="font-medium text-gymsanity-950">
                  {membership.plan.allowsGroupBooking ? "Included" : "—"}
                </dd>
                <dt className="text-gymsanity-800/70">1:1 booking</dt>
                <dd className="font-medium text-gymsanity-950">
                  {membership.plan.allowsOneOnOneBooking ? "Enabled" : "Upgrade"}
                </dd>
              </dl>
              {userRow?.stripeCustomerId && (
                <div className="mt-4 border-t border-gymsanity-100 pt-4">
                  <ManageBillingButton />
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gymsanity-800">No active membership.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gymsanity-200 bg-gradient-to-br from-gymsanity-50 to-violet-50/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Accountability streak
          </h2>
          <p className="mt-3 font-display text-3xl font-semibold text-gymsanity-950">
            {userRow?.loyaltyStreak ?? 0}
            <span className="text-lg font-medium text-gymsanity-700"> / 11</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gymsanity-900/80">
            Complete at least one program session each day (UTC). At day 11, you earn{" "}
            <span className="font-semibold text-gymsanity-900">one free 1:1 credit</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Continue training
          </h2>
          {nextDay ? (
            <div className="mt-3">
              <p className="font-medium text-gymsanity-950">{nextDay.title}</p>
              <p className="text-sm text-gymsanity-900/70">{nextDay.program.title}</p>
              <Link
                href={`/sessions/${nextDay.id}`}
                className="mt-4 inline-flex rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800"
              >
                Open session
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gymsanity-800">
              You&apos;re caught up—or explore a program to begin.
            </p>
          )}
          <Link
            href="/programs"
            className="mt-4 inline-block text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950"
          >
            Browse programs →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">
            Upcoming bookings
          </h2>
          <Link href="/book" className="text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950">
            Book
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-gymsanity-800">No upcoming sessions scheduled.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-col justify-between gap-1 border-b border-gymsanity-50 pb-3 last:border-0 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium text-gymsanity-950">
                    {b.slot.title ?? (b.slot.type === "GROUP" ? "Group class" : "1:1 coaching")}
                  </p>
                  <p className="text-sm text-gymsanity-900/70">
                    {new Date(b.slot.startAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {b.slot.location ?? "Location TBD"}
                  </p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-gymsanity-700">
                  {b.slot.type === "GROUP" ? "Group" : "1:1"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
