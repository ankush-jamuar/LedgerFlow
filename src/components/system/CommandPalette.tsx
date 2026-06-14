/**
 * src/components/system/CommandPalette.tsx — ⌘K Command Palette
 *
 * Keyboard-driven command palette inspired by Linear and Raycast.
 * Opens on Ctrl+K / Cmd+K. Searches navigation items.
 * Accessible: ARIA role="dialog", keyboard navigation, focus trap.
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Command } from "lucide-react";
import { NAV_GROUPS } from "@/constants/navigation";
import { cn } from "@/lib/utils/cn";

// ─── Context ────────────────────────────────────────────────

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be within CommandPaletteProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider value={{ open, close, toggle, isOpen }}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </CommandPaletteContext.Provider>
  );
}

// ─── All searchable commands ─────────────────────────────────

const ALL_COMMANDS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: item.href,
    label: item.label,
    icon: item.icon,
    group: group.label,
    href: item.href,
  }))
);

// ─── Palette UI ─────────────────────────────────────────────

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.group.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_COMMANDS;

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setQuery("");
      setActiveIndex(0);
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keep activeIndex in bounds when query changes
  useEffect(() => {
    const timer = setTimeout(() => setActiveIndex(0), 0);
    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[activeIndex]) navigate(filtered[activeIndex].href);
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  // Group filtered results
  const grouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, cmd) => {
      acc[cmd.group] = acc[cmd.group] ?? [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {}
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[600] flex items-start justify-center pt-[18vh] px-4">
            <motion.div
              key="cmd-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="glass-heavy w-full max-w-lg rounded-2xl border border-[var(--glass-border)] shadow-2xl overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Top gradient */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/60 to-transparent" />

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--glass-border)]">
                <Search className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  aria-label="Search commands"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-1 rounded-md border border-[var(--glass-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                  <Command className="h-2.5 w-2.5" />
                  K
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2" role="listbox">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Search className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([groupName, cmds]) => {
                    return (
                      <div key={groupName}>
                        <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                          {groupName}
                        </p>
                        {cmds.map((cmd) => {
                          const globalIndex = filtered.indexOf(cmd);
                          const isActive = globalIndex === activeIndex;
                          const Icon = cmd.icon;

                          return (
                            <button
                              key={cmd.id}
                              role="option"
                              aria-selected={isActive}
                              onClick={() => navigate(cmd.href)}
                              onMouseEnter={() => setActiveIndex(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                isActive
                                  ? "bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]"
                                  : "text-[var(--color-text-secondary)] hover:bg-white/[0.04]"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                                  isActive
                                    ? "bg-[var(--color-primary-ghost)]"
                                    : "bg-white/[0.06]"
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    isActive
                                      ? "text-[var(--color-primary-light)]"
                                      : "text-[var(--color-text-muted)]"
                                  )}
                                />
                              </div>
                              <span className="flex-1 text-left font-medium">
                                {cmd.label}
                              </span>
                              {isActive && (
                                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-[var(--glass-border)] px-4 py-2.5">
                {[
                  { keys: ["↑", "↓"], label: "Navigate" },
                  { keys: ["↵"], label: "Go" },
                  { keys: ["Esc"], label: "Dismiss" },
                ].map(({ keys, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border border-[var(--glass-border)] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
