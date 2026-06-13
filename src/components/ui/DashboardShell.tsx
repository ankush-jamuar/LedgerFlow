/**
 * src/components/ui/DashboardShell.tsx — Dashboard Page Shell
 *
 * Composes the standard page structure: a sticky header row (with
 * SectionHeader and optional actions) above the main content area.
 * Import this in each dashboard route's page.tsx as the outermost wrapper.
 */

import { cn } from "@/lib/utils/cn";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col gap-6 overflow-y-auto",
        className
      )}
    >
      {children}
    </main>
  );
}
