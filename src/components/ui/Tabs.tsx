/**
 * src/components/ui/Tabs.tsx — Animated Tab Bar
 *
 * Tab navigation with a Framer Motion sliding active indicator.
 * Uses layoutId so the indicator animates smoothly between tabs.
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  /** "underline" = line indicator, "pill" = filled background */
  variant?: "underline" | "pill";
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = "underline",
}: TabsProps) {
  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-[var(--glass-border)]",
          className
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              {tab.icon && (
                <span className="relative z-10">{tab.icon}</span>
              )}
              <span className="relative z-10">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center",
                    isActive
                      ? "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]"
                      : "bg-white/[0.06] text-[var(--color-text-muted)]"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div
      className={cn(
        "flex items-center border-b border-[var(--glass-border)] gap-6",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors duration-200",
              isActive
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center",
                  isActive
                    ? "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]"
                    : "bg-white/[0.06] text-[var(--color-text-muted)]"
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary-light)] rounded-t-full"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
