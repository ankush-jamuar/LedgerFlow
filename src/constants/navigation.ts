/**
 * src/constants/navigation.ts — Navigation Configuration
 *
 * Single source of truth for the application's navigation structure.
 * Used by the Sidebar, MobileNav, and breadcrumb components.
 * Adding a new route requires only an entry here — no component changes needed.
 */

import {
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Activity,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Badge count for notification indicators — populated at runtime */
  badgeKey?: "groups" | "expenses" | "settlements" | "activity";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Groups",
        href: "/groups",
        icon: Users,
        badgeKey: "groups",
      },
      {
        label: "Expenses",
        href: "/expenses",
        icon: Receipt,
        badgeKey: "expenses",
      },
      {
        label: "Settlements",
        href: "/settlements",
        icon: ArrowLeftRight,
        badgeKey: "settlements",
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "Import Center",
        href: "/import",
        icon: Upload,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        label: "Activity",
        href: "/activity",
        icon: Activity,
        badgeKey: "activity",
      },
      {
        label: "Chat",
        href: "/chat",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

/** Flat list of all nav items — useful for active-route matching */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
