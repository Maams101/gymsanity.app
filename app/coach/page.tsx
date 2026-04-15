import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CoachCreateSlotForm } from "@/components/CoachCreateSlotForm";
import { CoachBookingActions } from "@/components/CoachBookingActions";

export default async function CoachPage() {
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.BOOKED,
      slot: { startAt: { gte: now } },
    },
    orderBy: { slot: { startAt: "asc" } },
    include: {
      slot: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Coach desk</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Upcoming reservations and new availability. Mark outcomes after sessions to keep records
          clean.
        </p>
      </div>

      <CoachCreateSlotForm />

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
