import Link from "next/link";
import { redirect } from "next/navigation";
import { FocusGroupClaimButton } from "@/components/FocusGroupClaimButton";
import { FocusGroupJoinForm } from "@/components/FocusGroupJoinForm";
import {
  FOCUS_GROUP_JOIN_PATH,
  getFocusGroupProgramPath,
  isFocusGroupMember,
} from "@/lib/focus-group";
import { getSession } from "@/lib/get-session";

export default async function FocusGroupJoinPage() {
  const session = await getSession();
  const programPath = await getFocusGroupProgramPath();
  const loginNext = programPath;

  if (session?.role === "MEMBER" && (await isFocusGroupMember(session.sub))) {
    redirect(programPath);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">
          Focus group
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">
          Join Gymsanity
        </h1>
        <p className="mt-2 text-sm text-gymsanity-900/75">
          You&apos;re joining the <strong>Focus Group Challenge</strong> — full app access, no payment
          required. Create an account or sign in to get started.
        </p>
      </div>

      {session?.role === "MEMBER" ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 text-sm text-gymsanity-900/80">
            Signed in as <strong>{session.email}</strong>. Tap below to add focus-group access to this
            account.
          </div>
          <FocusGroupClaimButton loginNext={loginNext} />
        </div>
      ) : (
        <>
          <FocusGroupJoinForm />
          <p className="mt-6 text-xs text-gymsanity-800/70 text-center">
            Already have an account?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(FOCUS_GROUP_JOIN_PATH)}`}
              className="font-semibold underline hover:text-gymsanity-950"
            >
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
