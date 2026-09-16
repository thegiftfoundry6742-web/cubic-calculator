/**
 * Formats a numeric value into Indian Rupee (₹) currency format.
 * Uses en-IN locale with standard Indian numbering system (e.g. ₹1,25,000.00 or ₹1,399).
 */
export function formatINR(value: number, showDecimals: boolean = true): string {
  if (isNaN(value) || !isFinite(value)) return '₹0';
  
  // Format precision
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };

  try {
    return new Intl.NumberFormat('en-IN', options).format(value);
  } catch {
    // Fallback if Intl is unavailable
    const rounded = showDecimals ? value.toFixed(2) : Math.round(value).toString();
    return `₹${rounded}`;
  }
}

/**
 * Formats a percentage nicely (e.g. 25%, 16.67%).
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals).replace(/\.00$/, '')}%`;
}

/**
 * Formats grams or kilograms.
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2).replace(/\.00$/, '')} kg (${grams} g)`;
  }
  return `${grams} g`;
}

/**
 * Formats hours and minutes.
 */
export function formatTime(hours: number, minutes: number): string {
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}
