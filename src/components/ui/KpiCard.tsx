/**
 * src/components/ui/KpiCard.tsx — KPI Metric Card
 *
 * Animated metric card for dashboard KPIs.
 * Shows: label, value, optional trend delta, optional icon.
 * Includes skeleton loading state.
 */

"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SkeletonKpiCard } from "@/components/ui/Skeleton";

interface KpiCardProps {
  label: string;
  value: string;
  /** Change vs prior period, e.g. "+12%" */
  delta?: string;
  /** Semantic meaning of the delta */
  trend?: "up" | "down" | "neutral";
  /** Whether "up" is good (e.g. revenue) or bad (e.g. debt) */
  positiveIsGood?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  /** Optional additional context below the value */
  subValue?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  trend = "neutral",
  positiveIsGood = true,
  icon: Icon,
  loading = false,
  className,
  subValue,
}: KpiCardProps) {
  if (loading) return <SkeletonKpiCard />;

  const trendIsPositive = trend === "up";
  const isGood = positiveIsGood ? trendIsPositive : !trendIsPositive;
  const trendColor =
    trend === "neutral"
      ? "text-[var(--color-text-muted)]"
      : isGood
      ? "text-[var(--color-success)]"
      : "text-[var(--color-danger)]";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "glass rounded-xl p-5 relative overflow-hidden",
        "hover:border-[var(--glass-border-hover)] transition-colors",
        className
      )}
    >
      {/* Top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>
          {subValue && (
            <p className={cn(
              "mt-0.5 text-xs",
              label === "Net Outstanding"
                ? trend === "up"
                  ? "text-[var(--color-success-light)] font-semibold"
                  : trend === "down"
                  ? "text-[var(--color-danger-light)] font-semibold"
                  : "text-[var(--color-text-muted)]"
                : "text-[var(--color-text-muted)]"
            )}>
              {subValue}
            </p>
          )}
          {delta && (
            <div className={cn("mt-2 flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">{delta}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-ghost)]">
            <Icon className="h-5 w-5 text-[var(--color-primary-light)]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
