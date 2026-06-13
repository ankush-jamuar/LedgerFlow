/**
 * src/lib/utils/format-currency.ts — Currency Formatting Helper
 *
 * Convenience wrapper around Intl.NumberFormat for consistent currency
 * display throughout the UI layer. Decoupled from the currency engine
 * to allow pure UI usage without importing business logic.
 */

/**
 * Formats a number as a currency string using the browser/Node Intl API.
 *
 * @param amount    - Numeric value to format
 * @param currency  - ISO 4217 currency code (e.g. "USD", "EUR")
 * @param locale    - BCP 47 locale tag (defaults to "en-US")
 * @returns         - Formatted string, e.g. "$1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
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
 * Returns a compact currency representation for dashboard cards.
 * e.g. $1,200.00 → "$1.2K"
 */
export function formatCurrencyCompact(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
