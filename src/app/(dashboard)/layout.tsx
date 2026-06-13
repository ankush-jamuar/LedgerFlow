/**
 * src/app/(dashboard)/layout.tsx — Dashboard Route Group Layout
 *
 * Renders the full application shell: desktop Sidebar + MobileNav header
 * side by side with the main content area. All protected dashboard routes
 * are nested under this layout via the (dashboard) route group.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ensureCurrentLocalUser } from "@/lib/users/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureCurrentLocalUser();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar — hidden on desktop */}
        <MobileNav />

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
