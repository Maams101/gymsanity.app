import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckoutPoller } from "@/components/CheckoutPoller";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";

export default async function PostCheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/post-checkout");

  const active = await getActiveMembership(session.sub);
  if (active) {
    redirect("/today?checkout=success");
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-gymsanity-100 bg-white/90 p-8 text-center shadow-sm">
          <p className="font-display text-lg font-semibold text-gymsanity-950">
            Finalizing your membership
          </p>
          <p className="mt-3 text-sm text-gymsanity-800/85">Payment received. Syncing your account…</p>
        </div>
      }
    >
      <CheckoutPoller />
    </Suspense>
  );
}
