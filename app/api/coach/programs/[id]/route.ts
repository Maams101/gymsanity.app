import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  weeks: z.number().int().min(1).max(52).optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  assignedMemberId: z.union([z.string().min(1), z.null()]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      assignedMember: { select: { id: true, name: true, email: true } },
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ program });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const { assignedMemberId, ...rest } = parsed.data;
  const updateData: Prisma.ProgramUpdateInput = { ...rest };

  if (assignedMemberId !== undefined) {
    if (assignedMemberId === null) {
      updateData.assignedMember = { disconnect: true };
    } else {
      const member = await prisma.user.findFirst({
        where: { id: assignedMemberId, role: "MEMBER" },
      });
      if (!member) {
        return NextResponse.json({ error: "Member not found." }, { status: 400 });
      }
      updateData.assignedMember = { connect: { id: assignedMemberId } };
    }
  }

  const program = await prisma.program.update({
    where: { id },
    data: updateData,
    include: {
      assignedMember: { select: { id: true, name: true, email: true } },
      days: {
        orderBy: [{ weekNumber: "asc" }, { dayIndex: "asc" }],
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
  return NextResponse.json({ program });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.program.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
