import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOfferedMemberPlanSlug } from "@/lib/plan-offering";

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const offered = plans.filter((p) => isOfferedMemberPlanSlug(p.slug));
  return NextResponse.json({ plans: offered });
}
