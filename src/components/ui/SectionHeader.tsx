/**
 * src/components/ui/SectionHeader.tsx — Section Header
 *
 * A consistent header block for dashboard sections with a title,
 * optional subtitle, and an optional action slot (e.g. a button).
 * Used at the top of each dashboard page and within complex sections.
 */

import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional content rendered to the right of the title (e.g. action buttons) */
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)] truncate">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0 mt-3 sm:mt-0">{action}</div>
      )}
    </div>
  );
}
