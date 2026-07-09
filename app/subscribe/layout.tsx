import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";

export default async function SubscribeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/subscribe");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true, onboardingCompletedAt: true },
  });
  if (!user) redirect("/login");
  if (user.role === "COACH") redirect("/coach");
  if (!user.onboardingCompletedAt) redirect("/onboarding");

  const active = await getActiveMembership(session.sub);
  if (active) redirect("/today");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gymsanity-50 via-white to-violet-50/40">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-gymsanity-200/40 via-transparent to-violet-200/30"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-10">
        <Link
          href="/"
          className="inline-block font-display text-lg font-semibold text-gymsanity-950 hover:text-gymsanity-800"
        >
          Gymsanity
        </Link>
        <p className="mt-1 text-xs text-gymsanity-800/70">{session.email}</p>
        {children}
      </div>
    </div>
  );
}
