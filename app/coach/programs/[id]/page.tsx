import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { coachExerciseSelect } from "@/lib/coach-exercise";
import { ProgramBuilder } from "@/components/coach/ProgramBuilder";
import { ProgrammingNav } from "@/components/coach/ProgrammingNav";

type Props = { params: Promise<{ id: string }> };

export default async function CoachProgramEditPage({ params }: Props) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      assignedMember: { select: { id: true, name: true, email: true } },
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
            include: {
              exercises: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  prescription: true,
                  exerciseId: true,
                  section: true,
                  setCount: true,
                  pairGroupId: true,
                  pairType: true,
                  pairOrder: true,
                },
              },
            },
      },
    },
  });

  if (!program) notFound();

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: coachExerciseSelect,
  });

  return (
    <div className="space-y-6">
      <ProgrammingNav />
      <ProgramBuilder
      program={{
        ...program,
        assignedMemberId: program.assignedMemberId ?? null,
        assignedMember: program.assignedMember,
        days: program.days.map((d) => ({
          ...d,
          exercises: d.exercises,
        })),
      }}
      exercises={exercises}
      members={members}
    />
    </div>
  );
}
