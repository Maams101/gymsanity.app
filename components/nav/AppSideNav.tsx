"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/app-nav";
import { isNavItemActive } from "@/lib/app-nav";
import { NavIcon } from "@/components/nav/NavIcon";

type Props = {
  items: NavItem[];
};

export function AppSideNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block" aria-label="Main navigation">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item, items);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gymsanity-700 text-white shadow-sm"
                    : "text-gymsanity-900/80 hover:bg-white/80 hover:text-gymsanity-950"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
