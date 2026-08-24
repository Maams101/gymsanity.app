import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  FocusGroupSignupError,
  registerFocusGroupMember,
  setSessionCookie,
} from "@/lib/focus-group";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.focusGroupInvite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Invite link not found." }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "This invite link has already been used." }, { status: 409 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    const { user, sessionToken } = await registerFocusGroupMember(parsed.data);

    await prisma.focusGroupInvite.update({
      where: { token },
      data: { usedAt: new Date(), usedByUserId: user.id },
    });

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    if (err instanceof FocusGroupSignupError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("invite signup failed", err);
    return NextResponse.json({ error: "Focus group plan not configured." }, { status: 500 });
  }
}
