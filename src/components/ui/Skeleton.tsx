/**
 * src/components/ui/Skeleton.tsx — Shimmer Skeleton Loaders
 *
 * Provides placeholder shapes that shimmer while data loads.
 * Prevents CLS — shapes match the exact dimensions of real content.
 */

import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
  /** Rounded pill shape (for avatars, badges) */
  rounded?: boolean;
}

/** Base skeleton element with shimmer animation */
export function Skeleton({ className, rounded = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        rounded ? "rounded-full" : "rounded-lg",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Single line of skeleton text */
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

/** Skeleton for a KPI card */
export function SkeletonKpiCard() {
  return (
    <div className="glass rounded-xl p-5 space-y-3" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8" rounded />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Skeleton for a list row */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)]",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-8 w-8 flex-shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Skeleton for a table */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a card with title + content */
export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5 space-y-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="space-y-2">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-4/5" />
        <SkeletonText className="w-3/5" />
      </div>
    </div>
  );
}
