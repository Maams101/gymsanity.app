import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  programId: z.string().min(1),
  weekNumber: z.number().int().min(1),
  dayIndex: z.number().int().min(1),
  title: z.string().min(2),
  focusNote: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid day data." }, { status: 400 });
  }

  const day = await prisma.programDay.create({
    data: {
      programId: parsed.data.programId,
      weekNumber: parsed.data.weekNumber,
      dayIndex: parsed.data.dayIndex,
      title: parsed.data.title,
      focusNote: parsed.data.focusNote ?? null,
    },
  });

  return NextResponse.json({ day });
}
