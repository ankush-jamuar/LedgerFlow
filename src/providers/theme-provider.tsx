"use client";

/**
 * src/providers/theme-provider.tsx — Theme Provider
 *
 * Wraps next-themes ThemeProvider with application-specific defaults.
 * LedgerFlow defaults to dark mode. Users can override via Settings in Phase 2.
 */

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("[DEBUG] ThemeProvider initial html class:", document.documentElement.className);
      
      const observer = new MutationObserver(() => {
        console.log("[DEBUG] ThemeProvider html class changed:", document.documentElement.className);
      });
      
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }
  }, []);

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
