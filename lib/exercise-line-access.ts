import { prisma } from "@/lib/db";
import { memberCanAccessPublishedProgram } from "@/lib/program-visibility";

export async function memberCanAccessExerciseLine(userId: string, exerciseLineId: string) {
  const line = await prisma.exerciseLine.findUnique({
    where: { id: exerciseLineId },
    include: { programDay: { include: { program: true } } },
  });
  if (!line) return null;
  if (!memberCanAccessPublishedProgram(line.programDay.program, userId)) return null;
  return line;
}
