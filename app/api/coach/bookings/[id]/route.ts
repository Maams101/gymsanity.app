import { NextResponse } from "next/server";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  status: z.enum([
    BookingStatus.COMPLETED,
    BookingStatus.NO_SHOW,
    BookingStatus.CANCELLED,
  ]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.booking.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
