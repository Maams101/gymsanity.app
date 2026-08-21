import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  // 303 See Other: after POST logout, force a GET of the public homepage.
  // Default 307 keeps POST and lands on / with no POST handler → empty/collapsed UI.
  const res = NextResponse.redirect(new URL("/", origin), 303);
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
