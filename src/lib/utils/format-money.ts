/**
 * src/lib/utils/format-money.ts — Precision-Safe Monetary Formatting
 *
 * Financial values from the Prisma backend arrive as serialized Decimal strings
 * (e.g. "1234.5600"). This module provides type-safe display formatting that
 * preserves precision, avoids floating-point drift, and wraps Intl for locale
 * awareness.
 *
 * IMPORTANT: Never use parseFloat on financial values for storage or arithmetic.
 * Use these utilities only for UI display.
 */

/**
 * Safely parses a Decimal string, number, or Prisma Decimal-like object
 * into a JavaScript number for display purposes only.
 */
export function parseDecimal(value: string | number | { toNumber(): number } | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "toNumber" in value) return value.toNumber();
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a monetary value as a full currency string.
 * Input can be a Decimal string, number, or null.
 *
 * @example formatMoney("1234.56", "USD") → "$1,234.56"
 * @example formatMoney(0, "EUR") → "€0.00"
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  const amount = parseDecimal(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats a monetary value in compact notation for dashboard cards.
 * @example formatMoneyCompact(1200000, "USD") → "$1.2M"
 */
export function formatMoneyCompact(
  value: string | number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  const amount = parseDecimal(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(value, currency, locale);
  }
}

/**
 * Returns a sign-aware formatted string.
 * Positive amounts → "+$1,234.56" (emerald in UI)
 * Negative amounts → "-$1,234.56" (red in UI)
 */
export function formatMoneyWithSign(
  value: string | number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  const amount = parseDecimal(value);
  const formatted = formatMoney(Math.abs(amount), currency, locale);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Determines the semantic color class for a monetary value.
 * Used for balance displays.
 */
export function getBalanceColorClass(value: string | number | null | undefined): string {
  const amount = parseDecimal(value);
  if (amount > 0) return "text-[var(--color-success)]";
  if (amount < 0) return "text-[var(--color-danger)]";
  return "text-[var(--color-text-muted)]";
}

/**
 * Abbreviates large numbers for compact display (non-currency).
 * @example abbreviateNumber(1200) → "1.2K"
 */
export function abbreviateNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
