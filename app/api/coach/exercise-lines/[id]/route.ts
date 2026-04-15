import { ExerciseLineSection } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  prescription: z.string().min(1).optional(),
  section: z.nativeEnum(ExerciseLineSection).optional(),
  setCount: z.number().int().min(1).max(20).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const line = await prisma.exerciseLine.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ line });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.exerciseLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
