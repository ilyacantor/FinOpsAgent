// Utility functions for formatting financial values
// All financial values in the database are multiplied by 1000 and stored as integers

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '$0';
  }
  
  // Convert to number and divide by 1000 to get original dollar amount
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  const dollarAmount = numValue / 1000;
  
  // Format with exactly 2 decimal places and thousands separators
  return `$${dollarAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyWithSuffix(value: number | string | null | undefined, suffix: string): string {
  const formatted = formatCurrency(value);
  return `${formatted}${suffix}`;
}

// Global currency formatter - displays all values in thousands (K-scale) with no decimals
// This is the primary formatter for all monetary values throughout the application
export function formatCurrencyK(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '$0 K';
  }
  
  // Convert to number and divide by 1000 to get original dollar amount
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  const dollarAmount = numValue / 1000;
  
  // Convert to thousands and round to nearest integer
  const thousands = Math.round(dollarAmount / 1000);
  
  // Format with thousands separators
  return `$${thousands.toLocaleString()} K`;
}

// Legacy: Keep formatCurrencyCompact as an alias to formatCurrencyK for backward compatibility
export const formatCurrencyCompact = formatCurrencyK;