/**
 * src/lib/currency/index.ts — Currency Utilities
 *
 * Formatting and conversion utilities for multi-currency support.
 * Conversion rates will be fetched from an external provider in Phase 2.
 * These helpers are pure functions with no side effects.
 */

/**
 * Supported ISO 4217 currency codes.
 * Extend this list as additional currencies are onboarded.
 */
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "AUD",
  "CAD",
  "SGD",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Formats a numeric amount as a localised currency string.
 *
 * @param amount  - The numeric value to format
 * @param currency - ISO 4217 currency code
 * @param locale   - BCP 47 locale tag (defaults to "en-US")
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode | string = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parses a currency string (e.g. "$1,234.56") into a plain number.
 * Returns NaN if the string cannot be parsed.
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned);
}

/** Client-safe currency codes for assignment scope (mirrors exchange.ts). */
export const ASSIGNMENT_CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
