import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/lib/app-url";
import { CoachInviteManager } from "@/components/coach/CoachInviteManager";

export default async function CoachInvitesPage() {
  const invites = await prisma.focusGroupInvite.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      label: true,
      usedAt: true,
      expiresAt: true,
      createdAt: true,
      usedBy: { select: { name: true, email: true } },
    },
  });

  const serialized = invites.map((inv) => ({
    ...inv,
    usedAt: inv.usedAt?.toISOString() ?? null,
    expiresAt: inv.expiresAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Coach</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">Focus group invites</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Generate single-use invite links. Anyone with a link can create a free account and access
          the full app—no payment required.
        </p>
      </div>
      <CoachInviteManager initialInvites={serialized} appUrl={appBaseUrl()} />
    </div>
  );
}
