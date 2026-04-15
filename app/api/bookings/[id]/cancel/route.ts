import { NextResponse } from "next/server";
import { BookingStatus, SlotType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, userId: session.sub },
    include: { slot: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== BookingStatus.BOOKED) {
    return NextResponse.json({ error: "Booking cannot be cancelled." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    if (booking.slot.type === SlotType.ONE_ON_ONE && booking.creditCharged) {
      await tx.creditBalance.upsert({
        where: { userId: session.sub },
        create: { userId: session.sub, balance: 1 },
        update: { balance: { increment: 1 } },
      });
      await tx.creditLedger.create({
        data: {
          userId: session.sub,
          delta: 1,
          reason: `Refund for cancelled booking ${id}`,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
