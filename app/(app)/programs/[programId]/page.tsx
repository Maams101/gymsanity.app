import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

type Props = { params: Promise<{ programId: string }> };

export default async function ProgramDetailPage({ params }: Props) {
  const { programId } = await params;
  const session = await getSession();
  if (!session) return null;

  const membership = await getActiveMembership(session.sub);
  if (!membership?.plan.includesDigitalPrograms) {
    return (
      <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6">
        <p className="text-gymsanity-900">Your plan doesn&apos;t include digital programming.</p>
        <Link href="/programs" className="mt-4 inline-block text-sm font-semibold text-gymsanity-800">
          ← Back
        </Link>
      </div>
    );
  }

  const program = await prisma.program.findFirst({
    where: { id: programId, ...prismaWherePublishedProgramForMember(session.sub) },
    include: {
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
        include: {
          completions: { where: { userId: session.sub } },
        },
      },
    },
  });

  if (!program) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/programs" className="text-sm font-semibold text-gymsanity-800 hover:text-gymsanity-950">
          ← Programs
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-gymsanity-950">{program.title}</h1>
        {program.assignedMemberId && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
            Coach tailored · only visible to you
          </p>
        )}
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">{program.description}</p>
      </div>

      <ol className="space-y-3">
        {program.days.map((d) => {
          const done = d.completions.length > 0;
          return (
            <li key={d.id}>
              <Link
                href={`/sessions/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gymsanity-100 bg-white/90 px-4 py-4 shadow-sm hover:border-gymsanity-200"
              >
                <div>
                  <p className="font-medium text-gymsanity-950">{d.title}</p>
                  {d.focusNote && <p className="text-sm text-gymsanity-900/70">{d.focusNote}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    done ? "bg-emerald-50 text-emerald-800" : "bg-gymsanity-50 text-gymsanity-800"
                  }`}
                >
                  {done ? "Done" : "Open"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
