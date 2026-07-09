"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/app-nav";
import { isNavItemActive } from "@/lib/app-nav";
import { NavIcon } from "@/components/nav/NavIcon";

type Props = {
  items: NavItem[];
};

export function AppBottomNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gymsanity-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(46,16,101,0.08)] backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item, items);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                  active
                    ? "text-gymsanity-700"
                    : "text-gymsanity-800/55 hover:text-gymsanity-900"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                    active
                      ? "bg-gymsanity-700 text-white shadow-md shadow-gymsanity-700/25"
                      : "bg-transparent"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
