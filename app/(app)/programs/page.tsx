import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

export default async function ProgramsPage() {
  const session = await getSession();
  if (!session) return null;

  const membership = await getActiveMembership(session.sub);
  const programs = await prisma.program.findMany({
    where: prismaWherePublishedProgramForMember(session.sub),
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { days: true } } },
  });

  const canAccess = membership?.plan.includesDigitalPrograms;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Programs</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Structured training blocks—breath, strength, recovery—written in the Gymsanity voice.
        </p>
      </div>

      {!canAccess && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
          Your current plan doesn&apos;t include the digital library. Upgrade to unlock programming.
        </div>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm shadow-gymsanity-900/5"
          >
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">{p.title}</h2>
            {p.assignedMemberId && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                For you · coach tailored
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gymsanity-900/75">{p.description}</p>
            <p className="mt-3 text-xs text-gymsanity-800/70">
              {p.weeks} weeks · {p._count.days} sessions
            </p>
            {canAccess ? (
              <Link
                href={`/programs/${p.id}`}
                className="mt-4 inline-flex rounded-full bg-gymsanity-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gymsanity-800"
              >
                Open program
              </Link>
            ) : (
              <span className="mt-4 inline-flex cursor-not-allowed rounded-full bg-gymsanity-100 px-4 py-2 text-sm font-semibold text-gymsanity-500">
                Locked
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
