/**
 * src/components/ui/Tooltip.tsx — Simple Tooltip
 *
 * CSS-powered tooltip for icon labels and supplementary info.
 * No JS event listeners needed — pure CSS :hover behavior.
 */

import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("relative inline-flex group", className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          "absolute z-[var(--z-dropdown)] pointer-events-none",
          "whitespace-nowrap rounded-lg px-2.5 py-1.5",
          "glass-heavy border border-[var(--glass-border)]",
          "text-xs font-medium text-[var(--color-text-primary)]",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-150",
          positionClasses[side]
        )}
      >
        {content}
      </div>
    </div>
  );
}
