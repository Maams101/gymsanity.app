import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
