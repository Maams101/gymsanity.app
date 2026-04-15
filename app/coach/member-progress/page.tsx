import { notFound } from "next/navigation";
import { CoachMemberProgressSelect } from "@/components/coach/CoachMemberProgressSelect";
import { MemberProgressReport } from "@/components/coach/MemberProgressReport";
import { prisma } from "@/lib/db";

type Props = { searchParams: Promise<{ member?: string }> };

export default async function CoachMemberProgressPage({ searchParams }: Props) {
  const { member: memberParam } = await searchParams;

  const membersList = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  if (membersList.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Member progress</h1>
          <p className="mt-2 max-w-2xl text-gymsanity-900/75">
            Track consistency and reflection quality at a glance: completed sessions, latest training
            activity, and notes members leave after workouts.
          </p>
        </div>
        <p className="text-sm text-gymsanity-800">No members found yet.</p>
      </div>
    );
  }

  const ids = new Set(membersList.map((m) => m.id));
  const selectedId =
    memberParam && ids.has(memberParam) ? memberParam : membersList[0]!.id;

  const member = await prisma.user.findUnique({
    where: { id: selectedId },
    include: {
      memberNutritionPlan: true,
      completions: {
        orderBy: { completedAt: "desc" },
        include: {
          programDay: {
            include: {
              program: true,
            },
          },
        },
      },
    },
  });

  if (!member) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Member progress</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Track consistency and reflection quality at a glance: completed sessions, latest training
          activity, and notes members leave after workouts.
        </p>
      </div>

      <CoachMemberProgressSelect members={membersList} selectedId={selectedId} />

      <MemberProgressReport member={member} />
    </div>
  );
}
