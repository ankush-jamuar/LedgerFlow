/**
 * src/components/ui/GlassCard.tsx — Glassmorphism Card Component
 *
 * A reusable surface container with the glassmorphism aesthetic.
 * Supports optional hover lift animation via Framer Motion.
 * Used as the primary card primitive throughout the dashboard.
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** When true, the card lifts slightly on hover */
  hoverable?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Accessible label for interactive cards */
  "aria-label"?: string;
}

export function GlassCard({
  children,
  className,
  hoverable = false,
  onClick,
  "aria-label": ariaLabel,
}: GlassCardProps) {
  const baseClassName = cn(
    "glass rounded-xl p-5",
    hoverable && "cursor-pointer",
    className
  );

  if (hoverable) {
    return (
      <motion.div
        className={baseClassName}
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(124, 58, 237, 0.15)" }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClassName} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
