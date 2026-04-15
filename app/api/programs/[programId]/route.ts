import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { prismaWherePublishedProgramForMember } from "@/lib/program-visibility";

type Params = { params: Promise<{ programId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { programId } = await params;
  const program = await prisma.program.findFirst({
    where: { id: programId, ...prismaWherePublishedProgramForMember(session.sub) },
    include: {
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
        include: {
          exercises: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ program });
}
