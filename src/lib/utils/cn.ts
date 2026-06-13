/**
 * src/lib/utils/cn.ts — Class Name Utility
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication)
 * so that Tailwind utility classes are merged correctly when composing
 * component variants.
 *
 * Usage: cn("px-4", isActive && "bg-primary", className)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
