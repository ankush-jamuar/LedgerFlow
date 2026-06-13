"use client";

/**
 * src/components/layout/Sidebar.tsx — Desktop Sidebar Navigation
 *
 * Fixed-width sidebar with grouped navigation, user profile area,
 * and LedgerFlow branding. Responsive — hidden on mobile (MobileNav handles that).
 */

import { UserButton } from "@clerk/nextjs";
import { NAV_GROUPS } from "@/constants/navigation";
import { NavItem } from "./NavItem";

export function Sidebar() {
  return (
    <aside
      className="hidden lg:flex lg:flex-col"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex h-full flex-col border-r border-[var(--glass-border)] bg-[var(--color-brand-surface)]">
        {/* Brand */}
        <div className="flex h-16 flex-shrink-0 items-center gap-3 px-5 border-b border-[var(--glass-border)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <span className="text-sm font-black text-white">L</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text-primary)] leading-none">
              LedgerFlow
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Expense Reconciliation
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
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

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-[var(--glass-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                My Account
              </p>
              <p className="truncate text-[10px] text-[var(--color-text-muted)]">
                Manage profile & billing
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
