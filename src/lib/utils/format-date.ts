/**
 * src/lib/utils/format-date.ts — Date Formatting Helpers
 *
 * Consistent date and time formatting utilities using the Intl API.
 * No external date library dependency — keeps the bundle lean.
 * All functions are pure and timezone-safe when given a UTC Date.
 */

/**
 * Formats a date as a short human-readable string.
 * e.g. "Jun 13, 2026"
 */
export function formatDate(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Formats a date with time.
 * e.g. "Jun 13, 2026, 3:45 PM"
 */
export function formatDateTime(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Returns a relative time string using Intl.RelativeTimeFormat.
 * e.g. "2 days ago", "in 3 hours"
 */
export function formatRelativeTime(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, "second");
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(diffDays, "day");
}

/**
 * Returns an ISO 8601 date string (YYYY-MM-DD) for use in form inputs and APIs.
 */
export function toISODateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]!;
}
