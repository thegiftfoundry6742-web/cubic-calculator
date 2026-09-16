import type { RoundingConfig } from '../types/calculator';

/**
 * Rounds a price according to the selected rounding mode.
 */
export function roundPrice(price: number, config: RoundingConfig): number {
  if (isNaN(price) || !isFinite(price) || price <= 0) return 0;

  switch (config.mode) {
    case 'none':
      return Math.round(price * 100) / 100; // retain 2 decimals precision
    case '1':
      return Math.round(price);
    case '5':
      return Math.round(price / 5) * 5;
    case '10':
      return Math.round(price / 10) * 10;
    case '50':
      return Math.round(price / 50) * 50;
    case 'custom': {
      const step = Math.max(1, config.customStep || 1);
      return Math.round(price / step) * step;
    }
    default:
      return Math.round(price * 100) / 100;
  }
}
