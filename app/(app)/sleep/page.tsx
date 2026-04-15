import { SleepAdvicePanel } from "@/components/SleepAdvicePanel";
import { SleepJournalClient, type SleepEntryRow } from "@/components/SleepJournalClient";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

export default async function SleepJournalPage() {
  const session = await getSession();
  if (!session) return null;

  const rows = await prisma.sleepJournalEntry.findMany({
    where: { userId: session.sub },
    orderBy: { entryDate: "desc" },
    take: 120,
  });

  const initialEntries: SleepEntryRow[] = rows.map((r) => ({
    id: r.id,
    entryDate: r.entryDate,
    hoursAsleep: r.hoursAsleep,
    bedtimeRoutine: r.bedtimeRoutine,
    dreamsRecalled: r.dreamsRecalled,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gymsanity-700">Recovery</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-gymsanity-950">Sleep journal</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/80">
          Log how long you slept, what you did before bed, and dreams you remember. Better patterns
          start with honest notes—not judgment.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <SleepJournalClient initialEntries={initialEntries} />
        <SleepAdvicePanel />
      </div>
    </div>
  );
}
