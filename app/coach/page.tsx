import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFocusGroupFeedbackCount } from "@/lib/focus-group";
import { CoachCreateSlotForm } from "@/components/CoachCreateSlotForm";
import { CoachBookingActions } from "@/components/CoachBookingActions";
import { CoachWorkoutOfDayForm } from "@/components/coach/CoachWorkoutOfDayForm";
import { getCoachWorkoutOfDayForEdit } from "@/lib/workout-of-day";
import { localDateKey } from "@/lib/local-date";

export default async function CoachPage() {
  const now = new Date();
  const todayKey = localDateKey(now);
  const todayWod = await getCoachWorkoutOfDayForEdit(todayKey);

  const [bookings, feedbackCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: BookingStatus.BOOKED,
        slot: { startAt: { gte: now } },
      },
      orderBy: { slot: { startAt: "asc" } },
      include: {
        slot: true,
        user: { select: { name: true, email: true } },
      },
    }),
    getFocusGroupFeedbackCount(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Desk</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">Coach desk</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Daily workout, bookings, and availability—organized like a coaching command center.
        </p>
      </div>

      <CoachWorkoutOfDayForm
        initialDayKey={todayKey}
        initialWod={
          todayWod
            ? {
                title: todayWod.title,
                description: todayWod.description,
                blocks: todayWod.blocks,
                published: todayWod.published,
              }
            : null
        }
      />

      <CoachCreateSlotForm />

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Focus group feedback</h2>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          {feedbackCount === 0
            ? "Participants submit notes from Settings. Nothing yet."
            : `${feedbackCount} note${feedbackCount === 1 ? "" : "s"} from focus-group members.`}
        </p>
        <Link
          href="/coach/feedback"
          className="mt-4 inline-flex rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
        >
          View feedback
        </Link>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Focus group invites</h2>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          Generate single-use links for focus-group participants — full access, no payment required.
        </p>
        <Link
          href="/coach/invites"
          className="mt-4 inline-flex rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
        >
          Manage invites
        </Link>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Newsletter</h2>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          Send training notes to everyone who joins Gymsanity — with or without an active plan.
        </p>
        <Link
          href="/coach/newsletter"
          className="mt-4 inline-flex rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
        >
          Write a note
        </Link>
      </div>

      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Upcoming bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-gymsanity-800">No upcoming bookings.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 border-b border-gymsanity-50 pb-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gymsanity-950">
                    {b.user.name}{" "}
                    <span className="font-normal text-gymsanity-800/80">({b.user.email})</span>
                  </p>
                  <p className="text-sm text-gymsanity-900/75">
                    {b.slot.title ?? (b.slot.type === "GROUP" ? "Group class" : "1:1 coaching")} ·{" "}
                    {new Date(b.slot.startAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gymsanity-800/70">
                    {b.slot.type === "GROUP" ? "Group" : "1:1"} · {b.slot.location ?? "Location TBD"}
                  </p>
                </div>
                <CoachBookingActions bookingId={b.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
