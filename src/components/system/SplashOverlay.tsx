/**
 * src/components/system/SplashOverlay.tsx — Visual-Only Launch Screen
 *
 * A branded launch transition overlay rendered ON TOP of the dashboard.
 * The dashboard shell, skeletons, and all components render immediately
 * underneath. This overlay auto-fades after 1000ms.
 *
 * RULES (non-negotiable):
 *  ✓ Never controls authentication
 *  ✓ Never blocks rendering
 *  ✓ Never waits for queries
 *  ✓ Never depends on dashboard data
 *  ✓ Never depends on local user sync
 *  ✓ Never calls setReady()
 *  ✓ Never hides the dashboard until data loads
 *  ✓ Never affects routing or hydration
 *
 * Think: Apple launch screen / Linear startup / Arc Browser loading.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText } from "lucide-react";

const SPLASH_DURATION_MS = 1000;

export function SplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {/* Background — matches app background exactly */}
          <div className="absolute inset-0 bg-[#050816]" />

          {/* Gradient mesh effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-20 h-80 w-80 rounded-full bg-[var(--color-primary)] opacity-[0.07] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-20 h-80 w-80 rounded-full bg-[var(--color-secondary)] opacity-[0.05] blur-[100px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Animated logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_48px_rgba(124,58,237,0.35)]"
            >
              <ReceiptText className="h-8 w-8 text-white" strokeWidth={1.5} />
            </motion.div>

            {/* Brand text */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                LedgerFlow
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Financial OS
              </p>
            </motion.div>

            {/* Progress bar — pure CSS animation, no data dependency */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-32 h-0.5 rounded-full bg-white/[0.06] overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="h-full w-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
