import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const programs = await prisma.program.findMany({
    where: prismaWherePublishedProgramForMember(session.sub),
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      weeks: true,
      _count: { select: { days: true } },
    },
  });
  return NextResponse.json({ programs });
}
