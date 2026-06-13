"use client";

/**
 * src/components/layout/MobileNav.tsx — Mobile Navigation Sheet
 *
 * A slide-out navigation panel for mobile viewports using a custom
 * sheet built with Framer Motion. Visible only on screens below lg breakpoint.
 * Includes full navigation groups and user profile.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NAV_GROUPS } from "@/constants/navigation";
import { NavItem } from "./NavItem";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <header className="flex lg:hidden h-14 items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-4">
        <button
          id="mobile-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary">
            <span className="text-[10px] font-black text-white">L</span>
          </div>
          <span className="font-bold text-sm text-[var(--color-text-primary)]">
            LedgerFlow
          </span>
        </div>

        <div className="ml-auto">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--glass-border)] bg-[var(--color-brand-surface)] lg:hidden"
            >
              {/* Sheet header */}
              <div className="flex h-14 items-center justify-between border-b border-[var(--glass-border)] px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
                    <span className="text-xs font-black text-white">L</span>
                  </div>
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                    LedgerFlow
                  </span>
                </div>
                <button
                  aria-label="Close navigation"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation */}
              <nav
                className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
                onClick={() => setIsOpen(false)}
              >
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavItem item={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* Profile */}
              <div className="flex-shrink-0 border-t border-[var(--glass-border)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{ elements: { avatarBox: "h-8 w-8" } }}
                  />
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                    My Account
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
