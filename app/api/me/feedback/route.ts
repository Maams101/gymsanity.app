import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isFocusGroupMember } from "@/lib/focus-group";
import { getSession } from "@/lib/get-session";

const schema = z.object({
  message: z.string().trim().min(10).max(4000),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const focusGroup = await isFocusGroupMember(session.sub);
  if (!focusGroup) {
    return NextResponse.json({ error: "Feedback is only available for focus-group members." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write at least a few sentences of feedback." }, { status: 400 });
  }

  const row = await prisma.focusGroupFeedback.create({
    data: {
      userId: session.sub,
      message: parsed.data.message,
      rating: parsed.data.rating ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
