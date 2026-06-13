"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * src/app/not-found.tsx — 404 Not Found Page
 *
 * Rendered when notFound() is called or a route cannot be matched.
 * Provides clear navigation back to the application.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-8xl font-extrabold gradient-text mb-4">404</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
            Page not found
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8 text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg glass px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
