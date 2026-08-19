import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeMuscleGroupsInput } from "@/lib/muscle-groups";
import { requireCoach } from "@/lib/require-coach";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  muscleGroup: z.string().optional(),
  muscleGroups: z.array(z.string()).min(1).optional(),
  equipment: z.string().optional().nullable(),
  cues: z.string().optional(),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

  const data = parsed.data;
  let groups: string[] | undefined;
  if (data.muscleGroups !== undefined || data.muscleGroup !== undefined) {
    const normalized = normalizeMuscleGroupsInput(data.muscleGroups, data.muscleGroup);
    if (!normalized) {
      return NextResponse.json({ error: "Select at least one valid muscle group." }, { status: 400 });
    }
    groups = normalized;
  }

  const exercise = await prisma.exercise.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(groups && { muscleGroups: groups, muscleGroup: groups[0] }),
      ...(data.equipment !== undefined && { equipment: data.equipment }),
      ...(data.cues !== undefined && { cues: data.cues }),
      ...(data.videoUrl !== undefined && {
        videoUrl: data.videoUrl === "" ? null : data.videoUrl,
      }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });

  return NextResponse.json({ exercise });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
