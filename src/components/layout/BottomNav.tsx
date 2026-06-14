/**
 * src/components/layout/BottomNav.tsx — Mobile Bottom Navigation
 *
 * Intentionally designed for mobile — not a collapsed desktop nav.
 * Shows 5 core destinations in a thumb-friendly bottom bar.
 * Uses Framer Motion for the active indicator bubble.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Upload,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Imports", href: "/import", icon: Upload },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-[200] safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-[var(--color-brand-surface)]/90 backdrop-blur-xl border-t border-[var(--glass-border)]" />

      <div className="relative flex items-center justify-around px-2 pt-2 pb-3">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl",
                "transition-colors duration-150",
                isActive
                  ? "text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-xl bg-[var(--color-primary-ghost)]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}

              <span className="relative z-10">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="relative z-10 text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
