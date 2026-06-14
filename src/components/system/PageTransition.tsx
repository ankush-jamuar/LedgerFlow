/**
 * src/components/system/PageTransition.tsx — Route Transition Wrapper
 *
 * Wraps page content in a subtle fade + vertical motion animation.
 * Duration: 250ms — fast enough to not feel slow, slow enough to register.
 * Quality target: Linear / Raycast feel.
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
