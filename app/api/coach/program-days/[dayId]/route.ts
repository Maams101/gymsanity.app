import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  focusNote: z.union([z.string(), z.null()]).optional(),
});

type Params = { params: Promise<{ dayId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid day data." }, { status: 400 });
  }

  if (parsed.data.title === undefined && parsed.data.focusNote === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const data: { title?: string; focusNote?: string | null } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.focusNote !== undefined) {
    const note = parsed.data.focusNote;
    data.focusNote = note === null || note.trim() === "" ? null : note.trim();
  }

  const day = await prisma.programDay.update({
    where: { id: dayId },
    data,
  });

  return NextResponse.json({ day });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayId } = await params;
  await prisma.programDay.delete({ where: { id: dayId } });
  return NextResponse.json({ ok: true });
}
