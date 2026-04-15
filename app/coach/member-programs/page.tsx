import Link from "next/link";
import { prisma } from "@/lib/db";
import { TailoredProgramForm } from "@/components/coach/TailoredProgramForm";

export default async function CoachMemberProgramsPage() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const tailored = await prisma.program.findMany({
    where: { assignedMemberId: { not: null } },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      _count: { select: { days: true } },
      assignedMember: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Member programs</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Build programming for one person. When you publish from the editor, only that member sees it
          in Programs—everyone else stays on the shared library.
        </p>
      </div>

      <TailoredProgramForm members={members} />

      <div>
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Tailored programs</h2>
        {tailored.length === 0 ? (
          <p className="mt-3 text-sm text-gymsanity-800">None yet. Create one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tailored.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/coach/programs/${p.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gymsanity-100 bg-white/90 px-4 py-4 shadow-sm hover:border-gymsanity-200"
                >
                  <div>
                    <p className="font-medium text-gymsanity-950">{p.title}</p>
                    <p className="text-xs text-gymsanity-700">
                      {p.published ? "Published" : "Draft"} · {p._count.days} session days · For{" "}
                      <span className="font-medium text-violet-800">{p.assignedMember?.name}</span>
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
