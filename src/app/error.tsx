"use client";

/**
 * src/app/error.tsx — Root Error Boundary
 *
 * Displayed when an unhandled error is thrown within the root route segment.
 * Must be a Client Component per Next.js requirements.
 * Uses unstable_retry to attempt recovery without a full page reload.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    // In production, forward to your error monitoring service (e.g. Sentry)
    console.error("[LedgerFlow] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-2xl p-10 max-w-md w-full text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger-ghost)]">
          <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Something went wrong
        </h1>

        <p className="text-[var(--color-text-secondary)] mb-2 text-sm leading-relaxed">
          An unexpected error occurred. The team has been notified.
        </p>

        {error.digest && (
          <p className="text-xs text-[var(--color-text-muted)] mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </motion.div>
    </div>
  );
}
