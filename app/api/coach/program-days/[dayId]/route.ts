import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

type Params = { params: Promise<{ dayId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayId } = await params;
  await prisma.programDay.delete({ where: { id: dayId } });
  return NextResponse.json({ ok: true });
}
