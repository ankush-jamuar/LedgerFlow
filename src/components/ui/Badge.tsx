/**
 * src/components/ui/Badge.tsx — Status Badge
 *
 * Color-coded badge aligned with LedgerFlow financial semantics:
 *   success/emerald = positive, warning/amber = caution, danger/red = critical
 */

import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/[0.06] text-[var(--color-text-secondary)] border-[var(--glass-border)]",
  primary: "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)] border-[var(--color-primary-ghost)]",
  success: "bg-[var(--color-success-ghost)] text-[var(--color-success-light)] border-[var(--color-success-ghost)]",
  warning: "bg-[var(--color-warning-ghost)] text-[var(--color-warning-light)] border-[var(--color-warning-ghost)]",
  danger: "bg-[var(--color-danger-ghost)] text-[var(--color-danger-light)] border-[var(--color-danger-ghost)]",
  info: "bg-[var(--color-info-ghost)] text-[var(--color-info-light)] border-[var(--color-info-ghost)]",
  secondary: "bg-[var(--color-secondary-ghost)] text-[var(--color-secondary-light)] border-[var(--color-secondary-ghost)]",
  outline: "bg-transparent text-[var(--color-text-secondary)] border-[var(--glass-border)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-text-muted)]",
  primary: "bg-[var(--color-primary-light)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
  secondary: "bg-[var(--color-secondary)]",
  outline: "bg-[var(--color-text-muted)]",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
