/**
 * Pricing model types
 */
export type PricingModel = 'per_word' | 'per_minute' | 'per_project';

/**
 * Pricing configuration
 */
export interface PricingConfig {
  model: PricingModel;
  ratePerWord: number;
  ratePerMinute: number;
  projectRate: number;
  minimumFee: number;
  revisionSurcharge: number; // percentage (e.g., 50 = 50%)
}

/**
 * Quote calculation result
 */
export interface QuoteResult {
  wordCount: number;
  readingTime: string;
  readingMinutes: number;
  basePrice: number;
  minimumFee: number;
  finalPrice: number;
  revisionPrice: number;
  pricingModel: PricingModel;
  includesMinimumFee: boolean;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  model: 'per_word',
  ratePerWord: 0.10,
  ratePerMinute: 50,
  projectRate: 100,
  minimumFee: 50,
  revisionSurcharge: 50,
};

/**
 * Calculate quote based on pricing configuration
 */
export const calculateQuote = (
  wordCount: number,
  readingMinutes: number,
  readingTime: string,
  config: PricingConfig
): QuoteResult => {
  let basePrice = 0;

  // Calculate base price based on model
  switch (config.model) {
    case 'per_word':
      basePrice = wordCount * config.ratePerWord;
      break;
    case 'per_minute':
      basePrice = Math.ceil(readingMinutes) * config.ratePerMinute;
      break;
    case 'per_project':
      basePrice = config.projectRate;
      break;
  }

  // Apply minimum fee if needed
  const includesMinimumFee = basePrice < config.minimumFee;
  const finalPrice = Math.max(basePrice, config.minimumFee);

  // Calculate revision price (base price + surcharge)
  const revisionPrice = finalPrice * (1 + config.revisionSurcharge / 100);

  return {
    wordCount,
    readingTime,
    readingMinutes,
    basePrice,
    minimumFee: config.minimumFee,
    finalPrice,
    revisionPrice,
    pricingModel: config.model,
    includesMinimumFee,
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Get pricing model display name
 */
export const getPricingModelName = (model: PricingModel): string => {
  switch (model) {
    case 'per_word':
      return 'Per Word';
    case 'per_minute':
      return 'Per Minute';
    case 'per_project':
      return 'Per Project';
  }
};
