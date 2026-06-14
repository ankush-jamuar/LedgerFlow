/**
 * src/app/(dashboard)/layout.tsx — Dashboard Route Group Layout
 *
 * Renders the full application shell:
 *  - Desktop: adaptive hover Sidebar (fixed left) + Topbar + content
 *  - Tablet: MobileNav slide-over header + Topbar + content
 *  - Mobile: MobileNav header + BottomNav + content
 *
 * All protected dashboard routes are nested under this layout via
 * the (dashboard) route group.
 *
 * Shell providers (command palette, loading bar) are composed
 * via AppShellProvider.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppShellProvider } from "@/providers/app-shell-provider";
import { SplashOverlay } from "@/components/system/SplashOverlay";
import { ensureCurrentLocalUser } from "@/lib/users/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await ensureCurrentLocalUser();

  return (
    <AppShellProvider serverAuthenticated={!!account}>
      {/* Gradient mesh background layer */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" aria-hidden="true" />

      <div className="flex min-h-screen">
        {/* Desktop adaptive hover sidebar */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Tablet header (hidden on desktop and mobile) */}
          <MobileNav />

          {/* Topbar — sticky, above page content */}
          <Topbar />

          {/* Scrollable page content */}
          <main
            className="flex-1 overflow-y-auto pb-20 lg:pb-0"
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation (hidden on desktop) */}
      <BottomNav />

      {/* Visual-only splash overlay — auto-fades after 1000ms */}
      <SplashOverlay />
    </AppShellProvider>
  );
}
