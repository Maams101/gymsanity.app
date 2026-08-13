import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE, verifySession } from "./lib/auth";

const memberPaths = [
  "/today",
  "/dashboard",
  "/day",
  "/recovery",
  "/settings",
  "/programs",
  "/progress",
  "/book",
  "/sessions",
  "/sleep",
  "/nutrition",
  "/onboarding",
  "/subscribe",
  "/post-checkout",
];
const coachPaths = ["/coach"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/music" || pathname.startsWith("/music/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sleep";
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isMemberArea = memberPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isCoachArea = coachPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if ((isMemberArea || isCoachArea) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isCoachArea && session && session.role !== "COACH") {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  if (pathname === "/dashboard" || pathname === "/day") {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today",
    "/today/:path*",
    "/dashboard/:path*",
    "/day",
    "/day/:path*",
    "/recovery",
    "/recovery/:path*",
    "/settings",
    "/settings/:path*",
    "/programs/:path*",
    "/progress",
    "/progress/:path*",
    "/book/:path*",
    "/sessions/:path*",
    "/sleep",
    "/sleep/:path*",
    "/music",
    "/music/:path*",
    "/nutrition",
    "/nutrition/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/subscribe",
    "/subscribe/:path*",
    "/post-checkout",
    "/post-checkout/:path*",
    "/coach/:path*",
  ],
};
