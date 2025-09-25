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

// For chart formatting where we want to show values in K format
export function formatCurrencyK(value: number): string {
  // Value is already scaled by 1000, so divide by 1000 first, then by 1000 again for K format
  const dollarAmount = value / 1000;
  return `$${(dollarAmount / 1000).toFixed(0)}K`;
}