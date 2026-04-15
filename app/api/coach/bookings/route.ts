import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

export async function GET() {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.BOOKED,
      slot: { startAt: { gte: now } },
    },
    orderBy: { slot: { startAt: "asc" } },
    include: {
      slot: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ bookings });
}
