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
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "SGD",
  "AED",
  "JPY",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const supportedCurrencies: readonly CurrencyCode[] = SUPPORTED_CURRENCIES;

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const currencyMetadata: Record<CurrencyCode, CurrencyMeta> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
};

/**
 * Formats a numeric amount as a localised currency string.
 * Uses currencyMetadata to enforce correct symbols/formats.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale = "en-US"
): string {
  const upper = currency.toUpperCase();
  const meta = currencyMetadata[upper as CurrencyCode];
  
  // Custom display fallback if needed, but Intl.NumberFormat handles standard ISOs nicely.
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: meta ? meta.code : upper,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = meta ? meta.symbol : upper;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export const currencyFormatter = {
  format: (amount: number, currency: string = "USD", locale = "en-US") =>
    formatCurrency(amount, currency, locale),
};

import { convertAmount } from "./exchange";

export const currencyConverter = {
  convert: (amount: number, from: string, to: string): number => {
    return convertAmount(amount, from, to);
  }
};

/**
 * Parses a currency string (e.g. "$1,234.56") into a plain number.
 * Returns NaN if the string cannot be parsed.
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned);
}

/** Client-safe currency codes for assignment scope (mirrors exchange.ts). */
export const ASSIGNMENT_CURRENCIES = SUPPORTED_CURRENCIES;

