"use client";

/**
 * src/providers/theme-provider.tsx — Theme Provider
 *
 * Wraps next-themes ThemeProvider with application-specific defaults.
 * LedgerFlow defaults to dark mode. Users can override via Settings in Phase 2.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
