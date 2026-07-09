import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { localDateKey, yesterdayDateKey } from "@/lib/local-date";

export default async function RecoveryHubPage() {
  const session = await getSession();
  if (!session) return null;

  const lastNight = yesterdayDateKey();
  const sleep = await prisma.sleepJournalEntry.findUnique({
    where: { userId_entryDate: { userId: session.sub, entryDate: lastNight } },
    select: { hoursAsleep: true },
  });

  const cards = [
    {
      href: "/sleep",
      title: "Sleep journal",
      desc: "Log last night, wind-down habits, and dreams.",
      stat: sleep ? `${sleep.hoursAsleep} h logged` : "Not logged yet",
      accent: "border-violet-200 bg-violet-50/50",
    },
    {
      href: "/nutrition",
      title: "Nutrition",
      desc: "Goal-based playbooks and coach notes.",
      stat: "Fuel & habits",
      accent: "border-emerald-200 bg-emerald-50/50",
    },
    {
      href: "/settings#integrations",
      title: "Wearables",
      desc: "Connect Apple Health, Fitbit, Garmin, WHOOP, and more.",
      stat: "Auto-sync recovery data",
      accent: "border-sky-200 bg-sky-50/50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Recovery</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-gymsanity-950">Lifestyle & recovery</h1>
        <p className="mt-2 max-w-xl text-sm text-gymsanity-900/75">
          Sleep, nutrition, and wearable data—everything your coach uses to adjust training load.
        </p>
      </div>

      <p className="rounded-xl border border-gymsanity-200 bg-white/80 px-4 py-3 text-sm text-gymsanity-800">
        <span className="font-semibold text-gymsanity-950">Today:</span> {localDateKey()}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${c.accent}`}
          >
            <h2 className="font-display text-lg font-semibold text-gymsanity-950">{c.title}</h2>
            <p className="mt-2 text-sm text-gymsanity-800/85">{c.desc}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gymsanity-700">{c.stat}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
