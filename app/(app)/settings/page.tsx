import Link from "next/link";
import { FitnessIntegrationsPanel } from "@/components/settings/FitnessIntegrationsPanel";
import { prisma } from "@/lib/db";
import { getMemberFitnessConnections } from "@/lib/fitness-connections";
import { getSession } from "@/lib/get-session";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const [user, membership, credits, connections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { name: true, email: true },
    }),
    getActiveMembership(session.sub),
    getCreditBalance(session.sub),
    getMemberFitnessConnections(session.sub),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">You</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-gymsanity-950">Profile & settings</h1>
      </div>

      <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gymsanity-600">Name</dt>
            <dd className="font-medium text-gymsanity-950">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-gymsanity-600">Email</dt>
            <dd className="font-medium text-gymsanity-950">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-gymsanity-600">Plan</dt>
            <dd className="font-medium text-gymsanity-950">{membership?.plan.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gymsanity-600">1:1 credits</dt>
            <dd className="font-medium text-gymsanity-950">{credits}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Quick links</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          <li>
            <Link
              href="/book"
              className="inline-block rounded-full border border-gymsanity-200 px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              Book sessions
            </Link>
          </li>
          <li>
            <Link
              href="/progress"
              className="inline-block rounded-full border border-gymsanity-200 px-4 py-2 text-sm font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              Load progression
            </Link>
          </li>
        </ul>
      </section>

      <FitnessIntegrationsPanel initialConnections={connections} />

      <section className="rounded-2xl border border-gymsanity-200 bg-gymsanity-50/80 p-6">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Keep Gymsanity on your phone</h2>
        <p className="mt-2 text-sm text-gymsanity-800/85">
          Add to Home Screen (iPhone: Share → Add to Home Screen; Android: browser menu → Install app)
          for app-like access, faster launch, and session timers that stay front and center.
        </p>
      </section>

      <section className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gymsanity-700">Legal</h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          <li>
            <Link
              href="/privacy"
              className="inline-block rounded-full border border-gymsanity-200 px-4 py-2 font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="inline-block rounded-full border border-gymsanity-200 px-4 py-2 font-semibold text-gymsanity-900 hover:bg-gymsanity-50"
            >
              Terms of Service
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
