import Link from "next/link";
import { prisma } from "@/lib/db";
import { NewProgramForm } from "@/components/coach/NewProgramForm";

export default async function CoachProgramsPage() {
  const programs = await prisma.program.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      _count: { select: { days: true } },
      assignedMember: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Programs</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Compose training blocks from your exercise library—publish when a cohort is ready to see it
          in the member app.           For one person only, use{" "}
          <Link href="/coach/member-programs" className="font-semibold text-gymsanity-800 underline">
            Member programs
          </Link>
          .
        </p>
      </div>

      <NewProgramForm />

      <div>
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Your programs</h2>
        {programs.length === 0 ? (
          <p className="mt-3 text-sm text-gymsanity-800">None yet. Create one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {programs.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/coach/programs/${p.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gymsanity-100 bg-white/90 px-4 py-4 shadow-sm hover:border-gymsanity-200"
                >
                  <div>
                    <p className="font-medium text-gymsanity-950">{p.title}</p>
                    <p className="text-xs text-gymsanity-700">
                      {p.published ? "Published" : "Draft"} · {p._count.days} session days
                      {p.assignedMember ? (
                        <>
                          {" "}
                          · <span className="font-medium text-violet-800">For {p.assignedMember.name}</span>
                        </>
                      ) : (
                        <> · Library</>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gymsanity-800">Edit →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
