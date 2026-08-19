import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";
import { normalizeMuscleGroupsInput } from "@/lib/muscle-groups";
import { uniqueSlug } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  muscleGroup: z.string().optional(),
  muscleGroups: z.array(z.string()).min(1).optional(),
  equipment: z.string().optional(),
  cues: z.string().optional(),
  videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ exercises });
}

export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exercise data." }, { status: 400 });
  }

  const groups = normalizeMuscleGroupsInput(parsed.data.muscleGroups, parsed.data.muscleGroup);
  if (!groups) {
    return NextResponse.json({ error: "Select at least one valid muscle group." }, { status: 400 });
  }

  const slug = uniqueSlug(parsed.data.name);
  const exercise = await prisma.exercise.create({
    data: {
      name: parsed.data.name,
      slug,
      category: parsed.data.category ?? "strength",
      muscleGroup: groups[0],
      muscleGroups: groups,
      equipment: parsed.data.equipment || null,
      cues: parsed.data.cues ?? "",
      videoUrl: parsed.data.videoUrl || null,
      published: parsed.data.published ?? true,
    },
  });

  return NextResponse.json({ exercise });
}
