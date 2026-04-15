import { BookingStatus, SlotType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";

export async function bookSlot(userId: string, slotId: string) {
  const membership = await getActiveMembership(userId);
  if (!membership) {
    return { ok: false as const, error: "No active membership." };
  }

  const plan = membership.plan;
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: { where: { status: BookingStatus.BOOKED } },
    },
  });

  if (!slot) return { ok: false as const, error: "Slot not found." };
  if (slot.startAt < new Date()) return { ok: false as const, error: "Slot has already started." };

  const existing = await prisma.booking.findFirst({
    where: { userId, slotId, status: BookingStatus.BOOKED },
  });
  if (existing) return { ok: false as const, error: "You already booked this slot." };

  if (slot.type === SlotType.GROUP) {
    if (!plan.allowsGroupBooking) {
      return { ok: false as const, error: "Your plan does not include group sessions." };
    }
    const count = slot.bookings.length;
    if (count >= slot.capacity) {
      return { ok: false as const, error: "This class is full." };
    }
    const booking = await prisma.booking.create({
      data: { userId, slotId, status: BookingStatus.BOOKED },
    });
    return { ok: true as const, booking };
  }

  // ONE_ON_ONE
  if (!plan.allowsOneOnOneBooking) {
    return { ok: false as const, error: "Your plan does not include 1:1 coaching." };
  }
  const balance = await getCreditBalance(userId);
  if (balance < 1) {
    return { ok: false as const, error: "No 1:1 credits available." };
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slotLocked = await tx.slot.findUnique({
        where: { id: slotId },
        include: { bookings: { where: { status: BookingStatus.BOOKED } } },
      });
      if (!slotLocked) throw new Error("Slot missing");
      if (slotLocked.type !== SlotType.ONE_ON_ONE) throw new Error("Invalid slot");
      if (slotLocked.bookings.length >= slotLocked.capacity) {
        throw new Error("Slot taken");
      }

      const bal = await tx.creditBalance.findUnique({ where: { userId } });
      if (!bal || bal.balance < 1) throw new Error("Insufficient credits");

      await tx.creditBalance.update({
        where: { userId },
        data: { balance: bal.balance - 1 },
      });

      await tx.creditLedger.create({
        data: {
          userId,
          delta: -1,
          reason: `1:1 booking ${slotId}`,
        },
      });

      return tx.booking.create({
        data: {
          userId,
          slotId,
          status: BookingStatus.BOOKED,
          creditCharged: true,
        },
      });
    });
    return { ok: true as const, booking };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not complete booking.";
    return { ok: false as const, error: msg };
  }
}
