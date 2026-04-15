import type { Prisma } from "@prisma/client";

/** Published programs a member may open: library (no assignee) or assigned only to them. */
export function prismaWherePublishedProgramForMember(userId: string): Prisma.ProgramWhereInput {
  return {
    published: true,
    OR: [{ assignedMemberId: null }, { assignedMemberId: userId }],
  };
}

export function memberCanAccessPublishedProgram(
  program: { published: boolean; assignedMemberId: string | null },
  userId: string
): boolean {
  if (!program.published) return false;
  if (program.assignedMemberId == null) return true;
  return program.assignedMemberId === userId;
}
