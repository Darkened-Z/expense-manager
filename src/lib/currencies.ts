export interface SupportedCurrency {
  code: string;
  symbol: string;
  name: string;
  defaultRateToPKR: number;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'PKR', symbol: 'Rs. ', name: 'Pakistani Rupee', defaultRateToPKR: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', defaultRateToPKR: 278.5 },
  { code: 'EUR', symbol: '€', name: 'Euro', defaultRateToPKR: 302.0 },
  { code: 'GBP', symbol: '£', name: 'British Pound', defaultRateToPKR: 362.0 },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', defaultRateToPKR: 75.8 },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', defaultRateToPKR: 74.2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', defaultRateToPKR: 202.0 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', defaultRateToPKR: 182.0 },
];

export function getDefaultRate(currencyCode: string): number {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return found ? found.defaultRateToPKR : 1;
}

export function getCurrencySymbol(currencyCode: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return found ? found.symbol : currencyCode + ' ';
}

export function formatForeignAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
