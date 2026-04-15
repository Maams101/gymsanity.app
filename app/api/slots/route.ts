import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const slots = await prisma.slot.findMany({
    where: { startAt: { gte: now } },
    orderBy: { startAt: "asc" },
    include: {
      bookings: {
        where: { status: BookingStatus.BOOKED },
        select: { id: true, userId: true },
      },
    },
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      type: s.type,
      title: s.title,
      location: s.location,
      capacity: s.capacity,
      bookedCount: s.bookings.length,
      myBookingId: s.bookings.find((b) => b.userId === session.sub)?.id ?? null,
    })),
  });
}
