import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import { COACH_NAV, MEMBER_NAV } from "@/lib/app-nav";
import type { MemberNavPreview } from "@/lib/member-nav-preview";
import { AppBottomNav } from "@/components/nav/AppBottomNav";
import { AppSideNav } from "@/components/nav/AppSideNav";
import { SessionResumeHint } from "@/components/nav/SessionResumeHint";

type Props = {
  session: SessionPayload;
  children: React.ReactNode;
  variant?: "member" | "coach";
  memberNavPreview?: MemberNavPreview;
};

export function AppShell({ session, children, variant = "member", memberNavPreview }: Props) {
  const isCoachShell = variant === "coach";
  const navItems = isCoachShell ? COACH_NAV : MEMBER_NAV;
  const homeHref = isCoachShell ? "/coach" : "/today";

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-0 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 md:gap-8 md:px-6 md:pb-12 md:pt-8 lg:px-8">
      <aside className="hidden w-52 shrink-0 md:block lg:w-56">
        <div className="sticky top-8 space-y-8">
          <div>
            <Link href={homeHref} className="font-display text-xl font-semibold text-gymsanity-950">
              Gymsanity
            </Link>
            <p className="mt-1 text-xs text-gymsanity-800/70">
              {session.role === "COACH" ? "Coach" : "Member"}
            </p>
          </div>
          <AppSideNav items={navItems} />
          {session.role === "COACH" && !isCoachShell && (
            <Link
              href="/coach"
              className="block rounded-xl border border-gymsanity-200 bg-white/80 px-3 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-white"
            >
              Switch to coach desk →
            </Link>
          )}
          {session.role === "COACH" && isCoachShell && (
            <Link
              href="/today"
              className="block rounded-xl border border-gymsanity-200 bg-white/80 px-3 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-white"
            >
              Preview member app →
            </Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-gymsanity-800/80 hover:bg-white/70 hover:text-gymsanity-950"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6 flex items-center justify-between gap-3 border-b border-gymsanity-100/80 pb-4 md:hidden">
          <div>
            <Link href={homeHref} className="font-display text-lg font-semibold text-gymsanity-950">
              Gymsanity
            </Link>
            {memberNavPreview?.planName && !isCoachShell ? (
              <p className="text-[10px] font-medium uppercase tracking-wide text-gymsanity-600">
                {memberNavPreview.planName}
              </p>
            ) : null}
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-xs font-semibold text-gymsanity-800">
              Log out
            </button>
          </form>
        </header>

        {!isCoachShell ? <SessionResumeHint /> : null}

        <main>{children}</main>
      </div>

      <AppBottomNav items={navItems} />
    </div>
  );
}
