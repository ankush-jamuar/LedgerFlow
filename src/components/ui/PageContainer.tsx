/**
 * src/components/ui/PageContainer.tsx — Page Content Container
 *
 * Standard max-width wrapper with responsive horizontal padding.
 * All dashboard page bodies should render inside this component
 * to ensure consistent layout margins across routes.
 */

import { cn } from "@/lib/utils/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Remove the default max-width constraint for full-bleed layouts */
  fluid?: boolean;
}

export function PageContainer({
  children,
  className,
  fluid = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full px-4 sm:px-6 lg:px-8 py-6",
        !fluid && "max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
