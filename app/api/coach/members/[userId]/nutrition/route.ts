import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCoach } from "@/lib/require-coach";

const bodySchema = z.object({
  coachNotes: z.string().max(20_000),
});

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const member = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notes." }, { status: 400 });
  }

  await prisma.memberNutritionPlan.upsert({
    where: { userId },
    create: { userId, coachNotes: parsed.data.coachNotes },
    update: { coachNotes: parsed.data.coachNotes },
  });

  return NextResponse.json({ ok: true });
}
