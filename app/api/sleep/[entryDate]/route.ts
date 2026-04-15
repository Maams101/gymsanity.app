import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

type Params = { params: Promise<{ entryDate: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const { entryDate } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  try {
    await prisma.sleepJournalEntry.delete({
      where: {
        userId_entryDate: { userId: session.sub, entryDate },
      },
    });
  } catch {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
