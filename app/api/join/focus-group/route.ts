import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    const { sessionToken } = await registerFocusGroupMember(parsed.data);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, sessionToken);
    return res;
  } catch (err) {
    if (err instanceof FocusGroupSignupError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("focus-group signup failed", err);
    return NextResponse.json({ error: "Focus group plan not configured." }, { status: 500 });
  }
}
