/**
 * src/components/system/GlobalLoadingBar.tsx — Linear-style Top Progress Bar
 *
 * Non-blocking progress indicator shown during navigations, mutations,
 * and data refreshes. Lives at the very top of the viewport.
 * Uses a context so any component can trigger it.
 */

"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Context ────────────────────────────────────────────────

interface LoadingBarContextValue {
  start: () => void;
  done: () => void;
  isLoading: boolean;
}

const LoadingBarContext = createContext<LoadingBarContextValue | null>(null);

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext);
  if (!ctx) throw new Error("useLoadingBar must be used within LoadingBarProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────

export function LoadingBarProvider({ children }: { children: React.ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const isLoading = loadingCount > 0;

  const start = useCallback(() => {
    setLoadingCount((c) => c + 1);
    setProgress(0);
  }, []);

  const done = useCallback(() => {
    setLoadingCount((c) => Math.max(0, c - 1));
    setProgress(100);
  }, []);

  // Simulated progress while loading
  useEffect(() => {
    if (!isLoading) return;

    const t0 = setTimeout(() => setProgress(20), 0);
    const t1 = setTimeout(() => setProgress(50), 300);
    const t2 = setTimeout(() => setProgress(75), 700);
    const t3 = setTimeout(() => setProgress(90), 1400);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoading]);

  return (
    <LoadingBarContext.Provider value={{ start, done, isLoading }}>
      <GlobalLoadingBar progress={progress} visible={isLoading} />
      {children}
    </LoadingBarContext.Provider>
  );
}

// ─── Bar Component ──────────────────────────────────────────

interface GlobalLoadingBarProps {
  progress: number;
  visible: boolean;
}

function GlobalLoadingBar({ progress, visible }: GlobalLoadingBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.3 } }}
          className="fixed top-0 left-0 right-0 z-[9998] h-[2px]"
          aria-hidden="true"
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{
              background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
              boxShadow: "0 0 8px rgba(124, 58, 237, 0.7)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
