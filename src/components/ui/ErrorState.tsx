/**
 * src/components/ui/ErrorState.tsx — Graceful Error Display
 *
 * Shown when a data fetch fails. Always includes a retry action.
 * Never leaves users on a blank or broken page.
 */

"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  onRetry,
  className,
  size = "md",
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "gap-3 py-8 px-4" : "gap-4 py-12 px-6",
        className
      )}
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-danger-ghost)] border border-[var(--color-danger-ghost)]">
        <AlertTriangle className="h-6 w-6 text-[var(--color-danger-light)]" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
