import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  weeks: z.number().int().min(1).max(52).optional(),
  published: z.boolean().optional(),
  /// When set, only this member will see the program after publish (library programs omit this).
  assignedMemberId: z.string().min(1).optional(),
});

export async function GET() {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const programs = await prisma.program.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { days: true } },
      assignedMember: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ programs });
}

export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid program data." }, { status: 400 });
  }

  let assignedMemberId: string | null = null;
  if (parsed.data.assignedMemberId) {
    const member = await prisma.user.findFirst({
      where: { id: parsed.data.assignedMemberId, role: "MEMBER" },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 400 });
    }
    assignedMemberId = member.id;
  }

  const maxSort = await prisma.program.aggregate({ _max: { sortOrder: true } });
  const program = await prisma.program.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      weeks: parsed.data.weeks ?? 4,
      published: parsed.data.published ?? false,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      assignedMemberId,
    },
    include: {
      assignedMember: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ program });
}
