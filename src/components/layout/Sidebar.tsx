/**
 * src/components/layout/Sidebar.tsx — Adaptive Hover Sidebar
 *
 * Desktop navigation sidebar that expands on hover and collapses on leave.
 * No toggle button — intelligent, like Google products and Arc Browser.
 *
 * Collapsed state: 64px wide, icons only
 * Expanded state:  240px wide, icons + labels + groups
 *
 * Requirements:
 *  - Framer Motion powered width transition
 *  - No CLS — layout uses a fixed left-positioned aside, content uses margin
 *  - Active route preserved in both states
 *  - Grouped navigation from NAV_GROUPS
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ReceiptText, Command } from "lucide-react";
import { NAV_GROUPS } from "@/constants/navigation";
import { useCommandPalette } from "@/components/system/CommandPalette";
import { cn } from "@/lib/utils/cn";

const SIDEBAR_COLLAPSED_W = 64;
const SIDEBAR_EXPANDED_W = 240;
const SIDEBAR_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const { open: openCommandPalette } = useCommandPalette();

  return (
    <>
      {/* Spacer div maintains layout — prevents content jumping */}
      <motion.div
        animate={{ width: expanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
        transition={SIDEBAR_TRANSITION}
        className="hidden lg:block flex-shrink-0"
        aria-hidden="true"
      />

      {/* Fixed sidebar */}
      <motion.aside
        animate={{ width: expanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
        transition={SIDEBAR_TRANSITION}
        onHoverStart={() => setExpanded(true)}
        onHoverEnd={() => setExpanded(false)}
        className={cn(
          "hidden lg:flex flex-col",
          "fixed left-0 top-0 h-screen z-[200]",
          "bg-[var(--color-brand-surface)] border-r border-[var(--glass-border)]",
          "overflow-hidden"
        )}
        style={{ width: SIDEBAR_COLLAPSED_W }}
      >
        {/* Brand */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-[var(--glass-border)] px-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 min-w-0"
            tabIndex={expanded ? 0 : -1}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_16px_rgba(124,58,237,0.3)]">
              <ReceiptText className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-bold text-[var(--color-text-primary)] whitespace-nowrap leading-none">
                    LedgerFlow
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 whitespace-nowrap">
                    Financial OS
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] whitespace-nowrap"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5",
                          "transition-all duration-150",
                          "group",
                          isActive
                            ? "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-primary)]"
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl bg-[var(--color-primary-ghost)]"
                            transition={SIDEBAR_TRANSITION}
                          />
                        )}

                        <span className="relative z-10 flex-shrink-0">
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] transition-colors",
                              isActive
                                ? "text-[var(--color-primary-light)]"
                                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                            )}
                            aria-hidden="true"
                          />
                        </span>

                        <AnimatePresence>
                          {expanded && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.16 }}
                              className="relative z-10 flex-1 text-sm font-medium whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Active dot — visible only when collapsed */}
                        {isActive && !expanded && (
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[var(--color-primary-light)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--glass-border)] p-2.5 space-y-1">
          {/* Command palette shortcut */}
          <button
            onClick={openCommandPalette}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5",
              "text-[var(--color-text-muted)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-secondary)]",
              "transition-colors duration-150"
            )}
            aria-label="Open command palette"
          >
            <Command className="h-[18px] w-[18px] flex-shrink-0" />
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-1 items-center justify-between min-w-0"
                >
                  <span className="text-sm font-medium whitespace-nowrap">Search</span>
                  <kbd className="rounded border border-[var(--glass-border)] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
                    ⌘K
                  </kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* User profile */}
          <div className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2")}>
            <div className="flex-shrink-0">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-[22px] w-[22px]" },
                }}
              />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.16 }}
                  className="min-w-0"
                >
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
                    My Account
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
