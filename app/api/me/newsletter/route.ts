import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/get-session";
import { getSubscriptionForUser, setSubscriptionForUser } from "@/lib/newsletter";

const schema = z.object({
  subscribed: z.boolean(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await getSubscriptionForUser(session.sub, session.email);
  return NextResponse.json({
    subscribed: Boolean(row && !row.unsubscribedAt),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await setSubscriptionForUser(session.sub, parsed.data.subscribed);
  return NextResponse.json({ ok: true, subscribed: parsed.data.subscribed });
}
