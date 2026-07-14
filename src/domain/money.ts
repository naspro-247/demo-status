/**
 * Helpers for working with monetary values.
 *
 * Amounts are stored throughout the domain as integer minor units (kobo).
 * 100 kobo = 1 Naira (₦).
 */

export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Convert a major-unit amount (e.g. Naira entered by a user) into integer
 * minor units (kobo). Rounds to the nearest minor unit.
 *
 * @throws if the value is not a finite number.
 */
export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) {
    throw new Error(`Invalid amount: ${major}`);
  }
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

/** Convert integer minor units (kobo) into a major-unit number (Naira). */
export function toMajorUnits(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

/**
 * Format an amount in minor units as a currency string.
 * Defaults to the Naira symbol with grouped thousands and 2 decimals.
 */
export function formatMoney(minor: number, symbol = '₦'): string {
  const negative = minor < 0;
  const major = Math.abs(minor) / MINOR_UNITS_PER_MAJOR;
  const formatted = major.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${negative ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Parse a user-entered currency string (e.g. "1,250.50" or "₦1,250.50")
 * into integer minor units. Returns null when the input cannot be parsed
 * into a valid non-negative amount.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') {
    return null;
  }
  const major = Number(cleaned);
  if (!Number.isFinite(major) || major < 0) {
    return null;
  }
  return toMinorUnits(major);
}
