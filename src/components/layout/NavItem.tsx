"use client";

/**
 * src/components/layout/NavItem.tsx — Sidebar Navigation Item
 *
 * A single navigation link with active state detection, icon, label,
 * and hover animation. Uses usePathname for client-side active detection.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { NavItem as NavItemType } from "@/constants/navigation";

interface NavItemProps {
  item: NavItemType;
  collapsed?: boolean;
}

export function NavItem({ item, collapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]"
          : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]",
        collapsed && "justify-center px-2"
      )}
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-lg bg-[var(--color-primary-ghost)]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex-shrink-0">
        <Icon
          className={cn(
            "h-4.5 w-4.5 transition-colors",
            isActive
              ? "text-[var(--color-primary-light)]"
              : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
          )}
          aria-hidden="true"
        />
      </span>

      {!collapsed && (
        <span className="relative z-10 truncate">{item.label}</span>
      )}

      {isActive && !collapsed && (
        <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary-light)]" />
      )}
    </Link>
  );
}
