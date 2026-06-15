/**
 * Static exchange rates for assignment-scope multi-currency normalization.
 * Rates express how many INR one unit of each currency equals.
 * All conversions route through INR: rate(A→B) = TO_INR[A] / TO_INR[B].
 */

export class UnsupportedCurrencyError extends Error {
  constructor(value: string) {
    super(
      `Unsupported currency "${value}". Supported: ${ASSIGNMENT_CURRENCIES.join(", ")}`
    );
    this.name = "UnsupportedCurrencyError";
  }
}

export const ASSIGNMENT_CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;

export type AssignmentCurrency = (typeof ASSIGNMENT_CURRENCIES)[number];

/** 1 unit of currency → INR (assignment reference rates) */
const TO_INR: Record<AssignmentCurrency, number> = {
  INR: 1,
  USD: 85,
  EUR: 92,
  GBP: 107,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase().slice(0, 3);
}

export function isSupportedAssignmentCurrency(
  value: string
): value is AssignmentCurrency {
  return ASSIGNMENT_CURRENCIES.includes(normalizeCurrencyCode(value) as AssignmentCurrency);
}

export function assertSupportedCurrency(value: string): AssignmentCurrency {
  const code = normalizeCurrencyCode(value);
  if (!isSupportedAssignmentCurrency(code)) {
    throw new UnsupportedCurrencyError(value);
  }
  return code;
}

/** Exchange rate to convert 1 unit of `from` into `to` currency. */
export function getExchangeRate(from: string, to: string): number {
  const fromCode = assertSupportedCurrency(from);
  const toCode = assertSupportedCurrency(to);

  if (fromCode === toCode) {
    return 1;
  }

  return roundRate(TO_INR[fromCode] / TO_INR[toCode]);
}

export interface NormalizedAmount {
  originalAmount: number;
  originalCurrency: AssignmentCurrency;
  exchangeRate: number;
  baseAmount: number;
  groupCurrency: AssignmentCurrency;
}

/**
 * Normalize a transaction amount into the group's base currency.
 * Persists audit fields: originalAmount, originalCurrency, exchangeRate, baseAmount.
 */
export function normalizeToGroupBase(
  originalAmount: number,
  originalCurrency: string,
  groupCurrency: string
): NormalizedAmount {
  const original = assertSupportedCurrency(originalCurrency);
  const group = assertSupportedCurrency(groupCurrency);
  const exchangeRate = getExchangeRate(original, group);
  const baseAmount = roundMoney(originalAmount * exchangeRate);

  return {
    originalAmount: roundMoney(originalAmount),
    originalCurrency: original,
    exchangeRate,
    baseAmount,
    groupCurrency: group,
  };
}

/** Convert an amount from one currency to another (for cross-group dashboard totals). */
export function convertAmount(
  amount: number,
  from: string,
  to: string
): number {
  const rate = getExchangeRate(from, to);
  return roundMoney(amount * rate);
}
