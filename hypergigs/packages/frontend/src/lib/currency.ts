import type { Currency } from '@/types/auth';

// Exchange rates relative to USD (as of 2024)
// In production, these should be fetched from an API
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
};

// Currency names for display
export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
};

/**
 * Convert amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency
 * @param toCurrency - The target currency
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];

  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currency - The currency
 * @returns Formatted string (e.g., "$100", "£79", "€92")
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = amount.toFixed(2);

  // GBP and EUR typically have symbol before amount
  return `${symbol}${formatted}`;
}

/**
 * Calculate daily rate from hourly rate
 * @param hourlyRate - The hourly rate
 * @param hoursPerDay - Hours per working day (default: 8)
 * @returns Daily rate
 */
export function calculateDailyRate(hourlyRate: number, hoursPerDay: number = 8): number {
  return hourlyRate * hoursPerDay;
}

/**
 * Get all available currencies
 * @returns Array of currency options
 */
export function getCurrencyOptions(): Array<{ value: Currency; label: string; symbol: string }> {
  return [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
  ];
}
