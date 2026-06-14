"use client";

/**
 * src/providers/app-shell-provider.tsx — App Shell Provider
 *
 * Wraps the dashboard shell with system-level providers:
 *  - CommandPaletteProvider (⌘K shortcut)
 *  - LoadingBarProvider (route transition bar)
 */

import { CommandPaletteProvider } from "@/components/system/CommandPalette";
import { LoadingBarProvider } from "@/components/system/GlobalLoadingBar";

interface AppShellProviderProps {
  children: React.ReactNode;
  serverAuthenticated?: boolean;
}

export function AppShellProvider({ children }: AppShellProviderProps) {
  return (
    <CommandPaletteProvider>
      <LoadingBarProvider>
        {children}
      </LoadingBarProvider>
    </CommandPaletteProvider>
  );
}
