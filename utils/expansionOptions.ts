/**
 * Configuration for text expansion options
 */
export interface ExpansionOptions {
  expandNumbers: boolean;
  expandDates: boolean;
  expandCurrencies: boolean;
  expandPercentages: boolean;
  expandURLs: boolean;
  expandMeasurements: boolean;
}

export const DEFAULT_EXPANSION_OPTIONS: ExpansionOptions = {
  expandNumbers: true,
  expandDates: true,
  expandCurrencies: true,
  expandPercentages: true,
  expandURLs: false, // URLs are typically skipped in voiceovers
  expandMeasurements: true,
};

/**
 * Expansion type labels for UI
 */
export const EXPANSION_LABELS: Record<keyof ExpansionOptions, string> = {
  expandNumbers: 'Numbers',
  expandDates: 'Dates',
  expandCurrencies: 'Currencies',
  expandPercentages: 'Percentages',
  expandURLs: 'URLs',
  expandMeasurements: 'Measurements',
};

/**
 * Expansion type descriptions for tooltips
 */
export const EXPANSION_DESCRIPTIONS: Record<keyof ExpansionOptions, string> = {
  expandNumbers: '10,000 → ten thousand',
  expandDates: '01/12/25 → January twelfth twenty twenty-five',
  expandCurrencies: '$1,250 → one thousand two hundred fifty dollars',
  expandPercentages: '15% → fifteen percent',
  expandURLs: 'example.com → example dot com',
  expandMeasurements: '5\'10" → five feet ten inches',
};
