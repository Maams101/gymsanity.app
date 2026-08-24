import { NextResponse } from "next/server";
import {
  assignFocusGroupMembership,
  getFocusGroupProgramPath,
  isFocusGroupMember,
} from "@/lib/focus-group";
import { getSession } from "@/lib/get-session";

/** Grant focus-group access to a signed-in member (e.g. after using the universal link). */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Only members can join the focus group." }, { status: 403 });
  }

  if (await isFocusGroupMember(session.sub)) {
    const next = await getFocusGroupProgramPath();
    return NextResponse.json({ ok: true, next });
  }

  try {
    await assignFocusGroupMembership(session.sub);
    const next = await getFocusGroupProgramPath();
    return NextResponse.json({ ok: true, next });
  } catch (err) {
    console.error("focus-group claim failed", err);
    return NextResponse.json({ error: "Focus group plan not configured." }, { status: 500 });
  }
}
