import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ProgrammingNav } from "@/components/coach/ProgrammingNav";
import { ProgramsLibrary } from "@/components/coach/ProgramsLibrary";

export default async function CoachProgramsPage() {
  const [programs, members] = await Promise.all([
    prisma.program.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { days: true } },
        assignedMember: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">
          Programming
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">
          Programs library
        </h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Browse, filter, and open programs—library cohorts or 1:1 plans. Each program is built session
          by session from your exercise library.
        </p>
      </div>

      <ProgrammingNav />

      <Suspense fallback={<p className="text-sm text-gymsanity-700">Loading programs…</p>}>
        <ProgramsLibrary programs={programs} members={members} />
      </Suspense>
    </div>
  );
}
