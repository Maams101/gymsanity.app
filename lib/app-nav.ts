export type NavItem = {
  href: string;
  label: string;
  icon: "today" | "train" | "recovery" | "progress" | "you" | "desk" | "clients" | "build";
  /** Path prefixes that mark this tab active (first match wins in component). */
  activePrefixes: string[];
};

export const MEMBER_NAV: NavItem[] = [
  {
    href: "/today",
    label: "Today",
    icon: "today",
    activePrefixes: ["/today", "/dashboard", "/day"],
  },
  {
    href: "/programs",
    label: "Train",
    icon: "train",
    activePrefixes: ["/programs", "/sessions"],
  },
  {
    href: "/recovery",
    label: "Recovery",
    icon: "recovery",
    activePrefixes: ["/recovery", "/sleep", "/nutrition"],
  },
  {
    href: "/progress",
    label: "Progress",
    icon: "progress",
    activePrefixes: ["/progress"],
  },
  {
    href: "/settings",
    label: "You",
    icon: "you",
    activePrefixes: ["/settings", "/book"],
  },
];

export const COACH_NAV: NavItem[] = [
  {
    href: "/coach",
    label: "Desk",
    icon: "desk",
    activePrefixes: ["/coach"],
  },
  {
    href: "/coach/member-progress",
    label: "Clients",
    icon: "clients",
    activePrefixes: ["/coach/member-progress", "/coach/member-programs"],
  },
  {
    href: "/coach/programs",
    label: "Programs",
    icon: "build",
    activePrefixes: ["/coach/programs", "/coach/exercises"],
  },
  {
    href: "/today",
    label: "Member",
    icon: "today",
    activePrefixes: ["/today", "/programs", "/dashboard", "/sessions", "/recovery", "/progress", "/settings"],
  },
];

export function isNavItemActive(pathname: string, item: NavItem, allItems: NavItem[]): boolean {
  if (!item.activePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  // Coach "Member" tab: don't steal active state from /coach/* routes.
  if (item.href === "/today" && pathname.startsWith("/coach")) {
    return false;
  }
  // Prefer the most specific prefix match among items.
  const score = Math.max(
    ...item.activePrefixes.map((p) =>
      pathname === p || pathname.startsWith(`${p}/`) ? p.length : 0
    )
  );
  for (const other of allItems) {
    if (other.href === item.href) continue;
    const otherScore = Math.max(
      ...other.activePrefixes.map((p) =>
        pathname === p || pathname.startsWith(`${p}/`) ? p.length : 0
      )
    );
    if (otherScore > score) return false;
  }
  return score > 0;
}
