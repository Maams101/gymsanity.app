import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.focusGroupFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      message: f.message,
      rating: f.rating,
      createdAt: f.createdAt.toISOString(),
      user: f.user,
    })),
  });
}
