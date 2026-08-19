"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/coach/programs", label: "Programs library", match: "/coach/programs" },
  { href: "/coach/exercises", label: "Exercise library", match: "/coach/exercises" },
] as const;

export function ProgrammingNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 rounded-2xl border border-gymsanity-100 bg-gymsanity-50/80 p-1"
      aria-label="Programming"
    >
      {tabs.map((tab) => {
        const active =
          tab.match === "/coach/programs"
            ? pathname === tab.href || pathname.startsWith(`${tab.href}/`)
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-white text-gymsanity-950 shadow-sm"
                : "text-gymsanity-800 hover:text-gymsanity-950"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
