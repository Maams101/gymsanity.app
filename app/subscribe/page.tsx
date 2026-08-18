import { SubscribePlans } from "@/components/subscribe/SubscribePlans";
import { prisma } from "@/lib/db";
import { isOfferedMemberPlanSlug } from "@/lib/plan-offering";
import { isEmbeddedCheckoutConfigured, isStripeConfigured } from "@/lib/stripe";

type Search = Promise<{ checkout?: string }>;

export default async function SubscribePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const cancelled = sp.checkout === "cancelled";

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const offeredPlans = plans.filter((p) => isOfferedMemberPlanSlug(p.slug));

  const stripeOn = isStripeConfigured();
  const embeddedAvailable = isEmbeddedCheckoutConfigured();
  const purchasable = offeredPlans.filter((p) => Boolean(p.stripePriceId));
  const priceEnvHint: Record<string, string> = {
    digital: "STRIPE_PRICE_DIGITAL",
    "sessions-6": "STRIPE_PRICE_SESSIONS_6",
    "sessions-12": "STRIPE_PRICE_SESSIONS_12",
    "sessions-24": "STRIPE_PRICE_SESSIONS_24",
  };

  return (
    <div className="mt-12">
      {cancelled && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          Checkout didn&apos;t finish. Choose a plan below when you&apos;re ready—your profile is
          saved.
        </p>
      )}
      <p className="mb-6 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 text-sm text-gymsanity-950">
        Your goals questionnaire is saved. <span className="font-semibold">Pick a plan below</span>{" "}
        and complete checkout to unlock the app—programming, booking, and your dashboard.
      </p>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">
        Membership
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-gymsanity-950">
        Choose a session pack
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gymsanity-900/80">
        1:1 coaching is sold in 6, 12, or 24 session packages. The 6-pack is $170 per session; 12-
        and 24-packs take $5 and $10 off that rate. After payment, credits land in your account for
        booking.
      </p>

      {!stripeOn ? (
        <p className="mt-8 rounded-2xl border border-gymsanity-200 bg-white/90 p-6 text-sm text-gymsanity-900">
          Online billing isn&apos;t configured. Add{" "}
          <code className="rounded bg-gymsanity-100 px-1.5 py-0.5 text-xs">STRIPE_SECRET_KEY</code>{" "}
          to <code className="rounded bg-gymsanity-100 px-1.5 py-0.5 text-xs">.env</code>, save, and
          restart <code className="rounded bg-gymsanity-100 px-1.5 py-0.5 text-xs">npm run dev</code>
          . If you should already have access, contact your coach.
        </p>
      ) : purchasable.length === 0 ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
            <p className="font-semibold text-amber-950">Plans need Stripe Price IDs</p>
            <p className="mt-2 leading-relaxed">
              Your secret key is set, but no plan rows have a <code className="text-xs">price_…</code>{" "}
              ID yet — that&apos;s why you don&apos;t see payment buttons. Create{" "}
              <strong>recurring</strong> subscription prices in the Stripe Dashboard (Products), then
              either:
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-2 leading-relaxed">
              <li>
                Put the Price IDs in <code className="text-xs">.env</code> and run{" "}
                <code className="text-xs">npm run db:seed</code> (seed updates Digital and Elite price
                IDs).
              </li>
              <li>
                Or set <code className="text-xs">stripePriceId</code> on each{" "}
                <code className="text-xs">Plan</code> in Prisma Studio (
                <code className="text-xs">npm run db:studio</code>).
              </li>
            </ol>
            <ul className="mt-4 space-y-1.5 border-t border-amber-200/80 pt-4 text-xs text-amber-950/90">
              {offeredPlans.map((p) => (
                <li key={p.id}>
                  <span className="font-medium">{p.name}</span>{" "}
                  <span className="text-amber-900/80">({p.slug})</span>
                  {priceEnvHint[p.slug] ? (
                    <> → env: <code>{priceEnvHint[p.slug]}</code></>
                  ) : (
                    <> → set <code>stripePriceId</code> in the database</>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <SubscribePlans
          embeddedAvailable={embeddedAvailable}
          plans={purchasable.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            billingType: p.billingType,
            includesDigitalPrograms: p.includesDigitalPrograms,
            allowsGroupBooking: p.allowsGroupBooking,
            allowsOneOnOneBooking: p.allowsOneOnOneBooking,
            oneOnOneCreditsPerMonth: p.oneOnOneCreditsPerMonth,
          }))}
        />
      )}
    </div>
  );
}
