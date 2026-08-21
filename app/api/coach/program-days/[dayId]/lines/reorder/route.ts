import { ExerciseLineSection } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const SECTION_ORDER = [
  ExerciseLineSection.MOVEMENT_PREP,
  ExerciseLineSection.STRENGTH,
  ExerciseLineSection.COOLDOWN,
] as const;

const schema = z.object({
  /** Full day layout: each section's line IDs in display order (pair members stay consecutive). */
  sections: z.object({
    MOVEMENT_PREP: z.array(z.string().min(1)),
    STRENGTH: z.array(z.string().min(1)),
    COOLDOWN: z.array(z.string().min(1)),
  }),
});

type Params = { params: Promise<{ dayId: string }> };

/** POST — reorder / move exercise lines across sections (drag-and-drop). */
export async function POST(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder data." }, { status: 400 });
  }

  const day = await prisma.programDay.findUnique({
    where: { id: dayId },
    select: { id: true },
  });
  if (!day) return NextResponse.json({ error: "Session day not found." }, { status: 404 });

  const lines = await prisma.exerciseLine.findMany({
    where: { programDayId: dayId },
    select: { id: true, pairGroupId: true },
  });
  const existingIds = new Set(lines.map((l) => l.id));
  const pairById = new Map(lines.map((l) => [l.id, l.pairGroupId]));

  const { MOVEMENT_PREP, STRENGTH, COOLDOWN } = parsed.data.sections;
  const incoming = [...MOVEMENT_PREP, ...STRENGTH, ...COOLDOWN];

  if (incoming.length !== existingIds.size) {
    return NextResponse.json(
      { error: "Reorder must include every exercise in this session." },
      { status: 400 }
    );
  }
  if (new Set(incoming).size !== incoming.length) {
    return NextResponse.json({ error: "Duplicate exercise in reorder." }, { status: 400 });
  }
  for (const id of incoming) {
    if (!existingIds.has(id)) {
      return NextResponse.json({ error: "Unknown exercise in reorder." }, { status: 400 });
    }
  }

  // Paired lines must stay consecutive and in the same section.
  for (const sectionIds of [MOVEMENT_PREP, STRENGTH, COOLDOWN]) {
    let i = 0;
    while (i < sectionIds.length) {
      const id = sectionIds[i]!;
      const groupId = pairById.get(id);
      if (!groupId) {
        i += 1;
        continue;
      }
      const groupMembers = lines.filter((l) => l.pairGroupId === groupId).map((l) => l.id);
      const slice = sectionIds.slice(i, i + groupMembers.length);
      if (slice.length !== groupMembers.length || !groupMembers.every((gid) => slice.includes(gid))) {
        return NextResponse.json(
          { error: "Superset/circuit members must stay together in the same section." },
          { status: 400 }
        );
      }
      i += groupMembers.length;
    }
  }

  const sectionById = new Map<string, ExerciseLineSection>();
  for (const id of MOVEMENT_PREP) sectionById.set(id, ExerciseLineSection.MOVEMENT_PREP);
  for (const id of STRENGTH) sectionById.set(id, ExerciseLineSection.STRENGTH);
  for (const id of COOLDOWN) sectionById.set(id, ExerciseLineSection.COOLDOWN);

  const newOrder: string[] = [];
  for (const section of SECTION_ORDER) {
    newOrder.push(...parsed.data.sections[section]);
  }

  await prisma.$transaction(
    newOrder.map((id, index) =>
      prisma.exerciseLine.update({
        where: { id },
        data: {
          sortOrder: index + 1,
          section: sectionById.get(id)!,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
