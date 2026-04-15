import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { sleepJournalUpsertSchema } from "@/lib/sleep-journal-schema";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const entries = await prisma.sleepJournalEntry.findMany({
    where: { userId: session.sub },
    orderBy: { entryDate: "desc" },
    take: 120,
  });

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = sleepJournalUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sleep entry." }, { status: 400 });
  }

  const { entryDate, hoursAsleep, bedtimeRoutine, dreamsRecalled } = parsed.data;

  const entry = await prisma.sleepJournalEntry.upsert({
    where: {
      userId_entryDate: { userId: session.sub, entryDate },
    },
    create: {
      userId: session.sub,
      entryDate,
      hoursAsleep,
      bedtimeRoutine,
      dreamsRecalled: dreamsRecalled ?? "",
    },
    update: {
      hoursAsleep,
      bedtimeRoutine,
      dreamsRecalled: dreamsRecalled ?? "",
    },
  });

  return NextResponse.json({ entry });
}
