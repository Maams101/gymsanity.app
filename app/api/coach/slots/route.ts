import { NextResponse } from "next/server";
import { z } from "zod";
import { SlotType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.nativeEnum(SlotType),
  capacity: z.number().int().min(1).max(50).optional(),
  title: z.string().min(1).max(120).optional(),
  location: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slot data." }, { status: 400 });
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (endAt <= startAt) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const capacity =
    parsed.data.capacity ??
    (parsed.data.type === SlotType.GROUP ? 12 : 1);

  const slot = await prisma.slot.create({
    data: {
      startAt,
      endAt,
      type: parsed.data.type,
      capacity,
      title: parsed.data.title ?? null,
      location: parsed.data.location ?? null,
    },
  });

  return NextResponse.json({ slot });
}
