import { ExercisePairType } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  lineIds: z.array(z.string().min(1)).min(2),
  pairType: z.nativeEnum(ExercisePairType),
});

async function cleanupOrphanGroups(programDayId: string) {
  const lines = await prisma.exerciseLine.findMany({
    where: { programDayId, pairGroupId: { not: null } },
    select: { id: true, pairGroupId: true },
  });
  const byGroup = new Map<string, string[]>();
  for (const line of lines) {
    if (!line.pairGroupId) continue;
    const list = byGroup.get(line.pairGroupId) ?? [];
    list.push(line.id);
    byGroup.set(line.pairGroupId, list);
  }
  for (const ids of byGroup.values()) {
    if (ids.length === 1) {
      await prisma.exerciseLine.update({
        where: { id: ids[0] },
        data: { pairGroupId: null, pairType: null, pairOrder: null },
      });
    }
  }
}

/** POST — pair selected exercise lines into a superset or circuit */
export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select at least two exercises to pair." }, { status: 400 });
  }

  const uniqueIds = [...new Set(parsed.data.lineIds)];
  const lines = await prisma.exerciseLine.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, programDayId: true, section: true },
  });

  if (lines.length !== uniqueIds.length) {
    return NextResponse.json({ error: "One or more exercises were not found." }, { status: 404 });
  }

  const dayIds = new Set(lines.map((l) => l.programDayId));
  if (dayIds.size !== 1) {
    return NextResponse.json({ error: "All exercises must belong to the same session day." }, { status: 400 });
  }

  const programDayId = lines[0]!.programDayId;
  const groupId = randomUUID();

  const ordered = await prisma.exerciseLine.findMany({
    where: { programDayId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const orderIndex = new Map(ordered.map((l, i) => [l.id, i]));
  const sortedIds = [...uniqueIds].sort(
    (a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0)
  );

  await prisma.$transaction(
    sortedIds.map((id, idx) =>
      prisma.exerciseLine.update({
        where: { id },
        data: {
          pairGroupId: groupId,
          pairType: parsed.data.pairType,
          pairOrder: idx + 1,
        },
      })
    )
  );

  await cleanupOrphanGroups(programDayId);

  return NextResponse.json({ ok: true, pairGroupId: groupId });
}

/** DELETE — unpair selected lines (body: { lineIds: string[] }) */
export async function DELETE(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const lineIds = z.array(z.string().min(1)).min(1).safeParse(json?.lineIds);
  if (!lineIds.success) {
    return NextResponse.json({ error: "Select exercises to unpair." }, { status: 400 });
  }

  const lines = await prisma.exerciseLine.findMany({
    where: { id: { in: lineIds.data } },
    select: { id: true, programDayId: true },
  });
  if (lines.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.exerciseLine.updateMany({
    where: { id: { in: lines.map((l) => l.id) } },
    data: { pairGroupId: null, pairType: null, pairOrder: null },
  });

  const dayIds = [...new Set(lines.map((l) => l.programDayId))];
  for (const dayId of dayIds) {
    await cleanupOrphanGroups(dayId);
  }

  return NextResponse.json({ ok: true });
}
