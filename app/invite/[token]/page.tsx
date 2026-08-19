import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InviteRegisterForm } from "@/components/InviteRegisterForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.focusGroupInvite.findUnique({ where: { token } });

  if (!invite) notFound();

  const expired = invite.expiresAt && invite.expiresAt < new Date();
  const used = Boolean(invite.usedAt);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">You&apos;re invited</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">
          Join Gymsanity
        </h1>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          You&apos;ve been invited as part of the <strong>{invite.label}</strong> group. Create your account to
          get full access &mdash; no payment needed.
        </p>
      </div>

      {used ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          This invite link has already been used. If you already created an account,{" "}
          <a href="/login" className="font-semibold underline">
            log in here
          </a>.
        </div>
      ) : expired ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          This invite link has expired. Ask your coach for a new one.
        </div>
      ) : (
        <InviteRegisterForm token={token} />
      )}
    </div>
  );
}
