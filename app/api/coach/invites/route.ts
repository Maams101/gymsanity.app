import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  label: z.string().min(1).max(80).default("Focus Group"),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/** GET /api/coach/invites — list all invites */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await prisma.focusGroupInvite.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      label: true,
      usedAt: true,
      expiresAt: true,
      createdAt: true,
      usedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ invites });
}

/** POST /api/coach/invites — create a new invite */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const token = randomBytes(20).toString("hex");
  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000)
    : null;

  const invite = await prisma.focusGroupInvite.create({
    data: { token, label: parsed.data.label, expiresAt },
  });

  return NextResponse.json({ invite });
}

/** DELETE /api/coach/invites?id=xxx — delete an unused invite */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.focusGroupInvite.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
