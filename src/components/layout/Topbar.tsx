/**
 * src/components/layout/Topbar.tsx — Application Top Bar
 *
 * Persistent header row with:
 *  - Breadcrumb navigation (auto-generated from pathname)
 *  - Global search trigger (opens command palette)
 *  - Theme toggle (mount-guarded to prevent hydration mismatch)
 *  - Notification center
 *  - User profile (Clerk UserButton)
 *
 * HYDRATION NOTE:
 *  next-themes returns `undefined` for `theme` on the server (SSR) because
 *  the theme is stored in localStorage or a cookie and is not available
 *  during server rendering. If we render theme-dependent JSX immediately,
 *  the server HTML and client HTML differ → React hydration failure.
 *
 *  Fix: track `mounted` state. Before mount, render a neutral placeholder
 *  icon. After mount (client only), render the correct theme icon.
 */

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCommandPalette } from "@/components/system/CommandPalette";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { NotificationCenter } from "./NotificationCenter";

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { open: openCommandPalette } = useCommandPalette();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex h-14 flex-shrink-0 items-center border-b border-[var(--glass-border)] bg-[var(--color-topbar-bg)] backdrop-blur-xl px-4 gap-3 sticky top-0 z-[200]">
      {/* Breadcrumb — takes available space */}
      <div className="flex-1 min-w-0">
        <Breadcrumb pathname={pathname} />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Search / Command palette */}
        <button
          id="topbar-search"
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="flex items-center gap-2 h-9 rounded-lg border border-[var(--glass-border)] bg-white/[0.04] pl-3 pr-2 text-[var(--color-text-muted)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block text-xs">Search</span>
          <kbd className="hidden md:flex items-center gap-0.5 rounded border border-[var(--glass-border)] bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* Notification center */}
        <NotificationCenter />

        {/* Theme toggle */}
        <button
          id="topbar-theme-toggle"
          onClick={handleThemeToggle}
          aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-brand-hover)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          {!mounted ? (
            <Moon className="h-4 w-4" aria-hidden="true" />
          ) : theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--glass-border)] mx-1" />

        {/* User profile */}
        <UserButton
          appearance={{
            elements: { avatarBox: "h-7 w-7" },
          }}
        />
      </div>
    </header>
  );
}
