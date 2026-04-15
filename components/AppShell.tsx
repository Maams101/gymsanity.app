import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import type { MemberNavPreview } from "@/lib/member-nav-preview";
import { MemberNavDropdowns } from "@/components/MemberNavDropdowns";

type Props = {
  session: SessionPayload;
  children: React.ReactNode;
  variant?: "member" | "coach";
  /** Member-area nav previews; when set with variant "member", top nav uses dropdowns. */
  memberNavPreview?: MemberNavPreview;
};

export function AppShell({ session, children, variant = "member", memberNavPreview }: Props) {
  const coachLinks =
    variant === "coach"
      ? [
          { href: "/coach", label: "Desk" },
          { href: "/coach/member-progress", label: "Member progress" },
          { href: "/coach/member-programs", label: "Member programs" },
          { href: "/coach/exercises", label: "Exercise library" },
          { href: "/coach/programs", label: "Programs" },
          { href: "/dashboard", label: "Member view" },
        ]
      : null;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 pb-16 pt-8">
      <header className="flex flex-col gap-4 border-b border-gymsanity-100/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="font-display text-xl font-semibold text-gymsanity-950">
            Gymsanity
          </Link>
          <p className="text-xs text-gymsanity-800/70">
            {session.email} · {session.role === "COACH" ? "Coach" : "Member"}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {variant === "member" && memberNavPreview ? (
            <MemberNavDropdowns preview={memberNavPreview} />
          ) : (
            coachLinks?.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm text-gymsanity-900 hover:bg-white/70"
              >
                {l.label}
              </Link>
            ))
          )}
          {session.role === "COACH" && variant === "member" && (
            <Link
              href="/coach"
              className="rounded-full bg-gymsanity-100 px-3 py-1.5 text-sm font-medium text-gymsanity-900 hover:bg-gymsanity-200"
            >
              Coach
            </Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm text-gymsanity-800 hover:bg-white/70"
            >
              Log out
            </button>
          </form>
        </nav>
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
