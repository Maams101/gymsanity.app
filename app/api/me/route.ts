import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  const membership = await getActiveMembership(user.id);
  const credits = await getCreditBalance(user.id);

  return NextResponse.json({
    user,
    membership,
    credits,
  });
}
