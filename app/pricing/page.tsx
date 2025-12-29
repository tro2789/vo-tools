'use client';

import React, { useState, useEffect } from 'react';
import { PricingConfig, DEFAULT_PRICING_CONFIG, QuoteResult, calculateQuote, formatCurrency, PricingModel } from '@/utils/pricingTypes';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { DollarSign, Download, ArrowLeft, FileText, Clock, Type } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PricingPage() {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [wordCount, setWordCount] = useState<number>(100);
  const [readingMinutes, setReadingMinutes] = useState<number>(0.67);
  const [readingTime, setReadingTime] = useState<string>('40 sec');
  const [clientName, setClientName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  // Calculate quote when inputs change
  useEffect(() => {
    if (wordCount > 0) {
      const calculatedQuote = calculateQuote(
        wordCount,
        readingMinutes,
        readingTime,
        pricingConfig
      );
      setQuote(calculatedQuote);
    }
  }, [wordCount, readingMinutes, readingTime, pricingConfig]);

  const updatePricingConfig = <K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K]
  ) => {
    setPricingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    generateQuotePDF(
      quote,
      clientName || 'Client',
      projectName || 'Voiceover Project'
    );
  };

  const handleWordCountChange = (value: number) => {
    setWordCount(value);
    const minutes = value / 150; // 150 WPM default
    setReadingMinutes(minutes);
    
    // Format duration
    const totalSeconds = minutes * 60;
    if (totalSeconds < 60) {
      setReadingTime(`${Math.round(totalSeconds)} sec`);
    } else if (totalSeconds < 3600) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.round(totalSeconds % 60);
      setReadingTime(secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`);
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.round((totalSeconds % 3600) / 60);
      setReadingTime(mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Link 
            href="/"
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium hidden sm:inline">Back to Calculator</span>
          </Link>
          
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign size={20} />
            Pricing & Quotes
          </h1>
          
          <ThemeToggle />
        </div>
      </nav>

      <main className="w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            {/* Script Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <FileText size={16} />
                Script Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Word Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={wordCount}
                    onChange={(e) => handleWordCountChange(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <Clock size={12} />
                    Estimated Reading Time
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {readingTime}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    @ 150 words per minute
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Configuration Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <DollarSign size={16} />
                Pricing Configuration
              </h2>
              
              <div className="space-y-4">
                {/* Pricing Model */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Pricing Model
                  </label>
                  <select
                    value={pricingConfig.model}
                    onChange={(e) => updatePricingConfig('model', e.target.value as PricingModel)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="per_word">Per Word</option>
                    <option value="per_minute">Per Minute</option>
                    <option value="per_project">Per Project</option>
                  </select>
                </div>

                {/* Rate Input */}
                {pricingConfig.model === 'per_word' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Rate Per Word ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricingConfig.ratePerWord}
                      onChange={(e) => updatePricingConfig('ratePerWord', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.10"
                    />
                  </div>
                )}

                {pricingConfig.model === 'per_minute' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Rate Per Minute ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={pricingConfig.ratePerMinute}
                      onChange={(e) => updatePricingConfig('ratePerMinute', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50"
                    />
                  </div>
                )}

                {pricingConfig.model === 'per_project' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Project Rate ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={pricingConfig.projectRate}
                      onChange={(e) => updatePricingConfig('projectRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                )}

                {/* Minimum Fee */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Minimum Session Fee ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={pricingConfig.minimumFee}
                    onChange={(e) => updatePricingConfig('minimumFee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                {/* Revision Surcharge */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Revision Surcharge (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    value={pricingConfig.revisionSurcharge}
                    onChange={(e) => updatePricingConfig('revisionSurcharge', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quote Display */}
          <div className="space-y-6">
            {/* Quote Card */}
            {quote && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-lg border border-blue-200 dark:border-slate-700 p-6 sticky top-24">
                <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-6">
                  Your Quote
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Base Price:</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(quote.basePrice)}
                    </span>
                  </div>
                  
                  {quote.includesMinimumFee && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-white/50 dark:bg-slate-900/50 rounded-lg p-3">
                      ✓ Minimum session fee applied
                    </div>
                  )}
                  
                  <div className="h-px bg-blue-200 dark:bg-slate-700 my-4" />
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-slate-700 dark:text-slate-300">Initial Recording:</span>
                    <span className="text-4xl font-black bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                      {formatCurrency(quote.finalPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-baseline pt-4 border-t border-blue-200 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Revision/Pickup Fee:</span>
                    <span className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(quote.revisionPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-blue-200 dark:border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Client Name (for PDF)
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Client Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Project Name (for PDF)
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Voiceover Project"
                    />
                  </div>

                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                  >
                    <Download size={16} />
                    Download Quote PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
