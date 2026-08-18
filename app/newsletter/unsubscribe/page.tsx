import Link from "next/link";
import { unsubscribeByToken } from "@/lib/newsletter";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const row = token ? await unsubscribeByToken(token) : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-16">
      <Link href="/" className="font-display text-lg font-semibold text-gymsanity-950">
        Gymsanity
      </Link>
      <div className="mt-12 rounded-2xl border border-gymsanity-100 bg-white/90 p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-gymsanity-950">
          {row ? "You’re unsubscribed" : "Link didn’t work"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gymsanity-800/85">
          {row
            ? "You won’t get Gymsanity newsletter emails at this address. You can opt back in anytime from Settings."
            : "That unsubscribe link is missing or expired. If you’re still getting emails, use the link in the latest note or email support@gymsanity.fit."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800"
        >
          Back to Gymsanity
        </Link>
      </div>
    </div>
  );
}
