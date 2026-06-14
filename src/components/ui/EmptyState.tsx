/**
 * src/components/ui/EmptyState.tsx — Educational Empty States
 *
 * Shown when a data section has no content yet.
 * Always includes an actionable CTA so users know what to do next.
 */

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const containerSizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" };
  const titleSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "gap-3 py-8 px-4" : "gap-4 py-16 px-6",
        className
      )}
    >
      {/* Glowing icon container */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary-ghost)] blur-xl opacity-50" />
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl",
            "bg-[var(--color-primary-ghost)] border border-[var(--color-primary-ghost)]",
            containerSizes[size]
          )}
        >
          <Icon
            className={cn(iconSizes[size], "text-[var(--color-primary-light)]")}
            strokeWidth={1.5}
          />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3
          className={cn(
            "font-semibold text-[var(--color-text-primary)]",
            titleSizes[size]
          )}
        >
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
