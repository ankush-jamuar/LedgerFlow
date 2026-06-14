/**
 * src/components/layout/MobileNav.tsx — Tablet Slide-Over Navigation
 *
 * Slide-over navigation sheet for tablet viewports (sm to lg).
 * Mobile (< sm) uses BottomNav instead.
 * Desktop (>= lg) uses the adaptive hover Sidebar.
 *
 * This renders the hamburger header bar for tablet.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ReceiptText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NAV_GROUPS } from "@/constants/navigation";
import { NavItem } from "./NavItem";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Tablet header bar — hidden on desktop, visible on sm to lg */}
      <header className="flex lg:hidden h-14 items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-4 sticky top-0 z-[150]">
        <button
          id="mobile-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-sheet"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]">
            <ReceiptText className="h-3.5 w-3.5 text-white" />
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
              className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              id="mobile-nav-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-[190] flex w-72 flex-col border-r border-[var(--glass-border)] bg-[var(--color-brand-surface)] lg:hidden"
            >
              {/* Sheet header */}
              <div className="flex h-14 items-center justify-between border-b border-[var(--glass-border)] px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]">
                    <ReceiptText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)] leading-none">
                      LedgerFlow
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      Financial OS
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Close navigation"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-primary)] transition-colors"
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
