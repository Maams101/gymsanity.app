import { getSession } from "@/lib/get-session";
import { GROUP_SESSIONS_ENABLED } from "@/lib/group-sessions";
import { getActiveMembership, getCreditBalance } from "@/lib/membership";
import { BookPageClient } from "@/components/BookPageClient";

export default async function BookPage() {
  const session = await getSession();
  if (!session) return null;

  const membership = await getActiveMembership(session.sub);
  const credits = await getCreditBalance(session.sub);

  const allowsGroup = GROUP_SESSIONS_ENABLED && (membership?.plan.allowsGroupBooking ?? false);
  const allowsOneOnOne = membership?.plan.allowsOneOnOneBooking ?? false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Book sessions</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Use a 1:1 credit for private coaching. Credits apply when you confirm a private slot.
        </p>
      </div>

      <BookPageClient allowsGroup={allowsGroup} allowsOneOnOne={allowsOneOnOne} credits={credits} />
    </div>
  );
}
