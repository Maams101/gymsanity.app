import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocument({ title, lastUpdated, children }: Props) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <Link
        href="/"
        className="font-display text-lg font-semibold text-gymsanity-950 hover:text-gymsanity-800"
      >
        Gymsanity
      </Link>

      <header className="mt-10 border-b border-gymsanity-100 pb-6">
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">{title}</h1>
        <p className="mt-2 text-sm text-gymsanity-700">Last updated: {lastUpdated}</p>
      </header>

      <article className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-gymsanity-900/85">
        {children}
      </article>

      <footer className="mt-12 flex flex-wrap gap-4 border-t border-gymsanity-100 pt-6 text-sm">
        <Link href="/privacy" className="font-semibold text-gymsanity-800 hover:text-gymsanity-950">
          Privacy Policy
        </Link>
        <Link href="/terms" className="font-semibold text-gymsanity-800 hover:text-gymsanity-950">
          Terms of Service
        </Link>
        <Link href="/login" className="text-gymsanity-700 hover:text-gymsanity-950">
          Log in
        </Link>
      </footer>
    </div>
  );
}
