import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function PostCheckoutLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/post-checkout");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gymsanity-50 via-white to-violet-50/40">
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
