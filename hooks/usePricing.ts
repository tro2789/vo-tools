import { useState, useEffect, useCallback } from 'react';
import {
  PricingConfig,
  DEFAULT_PRICING_CONFIG,
  QuoteResult,
  calculateQuote,
  PricingModel
} from '@/utils/pricingTypes';
import { generateQuotePDF } from '@/utils/pdfGenerator';

/**
 * Custom hook for pricing and quote generation
 * Handles pricing configuration, quote calculation, and PDF generation
 */
export const usePricing = (
  wordCount: number,
  wpm: number,
  readingTime: string
) => {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [showPricing, setShowPricing] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  // Update specific pricing config field
  const updatePricingConfig = useCallback(<K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K]
  ) => {
    setPricingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Calculate quote when dependencies change
  useEffect(() => {
    if (wordCount > 0) {
      const readingMinutes = wordCount / (wpm || 1);
      const calculatedQuote = calculateQuote(
        wordCount,
        readingMinutes,
        readingTime,
        pricingConfig
      );
      setQuote(calculatedQuote);
    } else {
      setQuote(null);
    }
  }, [wordCount, wpm, readingTime, pricingConfig]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(() => {
    if (!quote) return;
    generateQuotePDF(
      quote,
      clientName || 'Client',
      projectName || 'Voiceover Project'
    );
  }, [quote, clientName, projectName]);

  return {
    pricingConfig,
    updatePricingConfig,
    showPricing,
    setShowPricing,
    clientName,
    setClientName,
    projectName,
    setProjectName,
    quote,
    handleDownloadPDF
  };
};
