import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getMemberWorkoutOfDay } from "@/lib/workout-of-day";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const wod = await getMemberWorkoutOfDay(session.sub);
  return NextResponse.json({ wod });
}
