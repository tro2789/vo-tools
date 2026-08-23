import { describe, it, expect } from 'vitest';
import {
  calculateQuote,
  formatCurrency,
  getPricingModelName,
  DEFAULT_PRICING_CONFIG,
  PricingConfig,
} from './pricingTypes';

describe('calculateQuote', () => {
  it('calculates per-word pricing correctly', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_word', ratePerWord: 0.1, minimumFee: 0 };
    const quote = calculateQuote(500, 3.33, '3 min 20 sec', config);
    expect(quote.basePrice).toBeCloseTo(50, 5);
    expect(quote.finalPrice).toBeCloseTo(50, 5);
    expect(quote.includesMinimumFee).toBe(false);
  });

  it('calculates per-minute pricing by rounding UP fractional minutes', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_minute', ratePerMinute: 50, minimumFee: 0 };
    // 2.1 minutes should bill as 3 whole minutes (Math.ceil)
    const quote = calculateQuote(300, 2.1, '2 min 6 sec', config);
    expect(quote.basePrice).toBe(150);
  });

  it('calculates per-project pricing as a flat rate regardless of word count', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_project', projectRate: 500, minimumFee: 0 };
    const quote = calculateQuote(10000, 60, '60 min', config);
    expect(quote.basePrice).toBe(500);
  });

  it('applies the minimum fee when the base price falls below it', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_word', ratePerWord: 0.1, minimumFee: 50 };
    const quote = calculateQuote(10, 0.1, '6 sec', config); // basePrice = 1
    expect(quote.basePrice).toBe(1);
    expect(quote.finalPrice).toBe(50);
    expect(quote.includesMinimumFee).toBe(true);
  });

  it('does not apply the minimum fee when base price meets or exceeds it', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_word', ratePerWord: 0.1, minimumFee: 50 };
    const quote = calculateQuote(500, 3.33, '3 min 20 sec', config); // basePrice = 50, equal to minimum
    expect(quote.includesMinimumFee).toBe(false);
    expect(quote.finalPrice).toBe(50);
  });

  it('computes revisionPrice as finalPrice plus the surcharge percentage', () => {
    const config: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      model: 'per_word',
      ratePerWord: 0.1,
      minimumFee: 0,
      revisionSurcharge: 50,
    };
    const quote = calculateQuote(1000, 6.67, '6 min 40 sec', config); // basePrice = 100
    expect(quote.finalPrice).toBeCloseTo(100, 5);
    expect(quote.revisionPrice).toBeCloseTo(150, 5);
  });

  it('handles zero word count without throwing and yields zero base price', () => {
    const config: PricingConfig = { ...DEFAULT_PRICING_CONFIG, model: 'per_word', minimumFee: 0 };
    const quote = calculateQuote(0, 0, '0 sec', config);
    expect(quote.basePrice).toBe(0);
    expect(quote.finalPrice).toBe(0);
  });

  it('preserves wordCount, readingTime, and pricingModel passthrough fields', () => {
    const quote = calculateQuote(123, 0.82, '49 sec', DEFAULT_PRICING_CONFIG);
    expect(quote.wordCount).toBe(123);
    expect(quote.readingTime).toBe('49 sec');
    expect(quote.pricingModel).toBe(DEFAULT_PRICING_CONFIG.model);
  });
});

describe('formatCurrency', () => {
  it('formats a whole number as USD currency', () => {
    expect(formatCurrency(50)).toBe('$50.00');
  });

  it('formats a decimal amount rounded to two places', () => {
    expect(formatCurrency(19.999)).toBe('$20.00');
  });

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts with a leading minus sign', () => {
    expect(formatCurrency(-25)).toBe('-$25.00');
  });
});

describe('getPricingModelName', () => {
  it('returns the correct display name for each pricing model', () => {
    expect(getPricingModelName('per_word')).toBe('Per Word');
    expect(getPricingModelName('per_minute')).toBe('Per Minute');
    expect(getPricingModelName('per_project')).toBe('Per Project');
  });
});
