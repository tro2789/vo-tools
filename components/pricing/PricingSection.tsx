import React from 'react';
import { DollarSign, Download } from 'lucide-react';
import { PricingConfig, QuoteResult, formatCurrency, PricingModel } from '@/utils/pricingTypes';

interface PricingSectionProps {
  showPricing: boolean;
  setShowPricing: (show: boolean) => void;
  pricingConfig: PricingConfig;
  updatePricingConfig: <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) => void;
  quote: QuoteResult | null;
  clientName: string;
  setClientName: (name: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  handleDownloadPDF: () => void;
  isComparisonMode?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  showPricing,
  setShowPricing,
  pricingConfig,
  updatePricingConfig,
  quote,
  clientName,
  setClientName,
  projectName,
  setProjectName,
  handleDownloadPDF,
  isComparisonMode = false
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setShowPricing(!showPricing)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <DollarSign size={16} />
          Pricing & Quote
        </span>
        <span className={`text-slate-400 transition-transform ${showPricing ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {showPricing && (
        <div className="px-5 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Pricing Model Selection */}
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

          {/* Rate Input (conditional based on model) */}
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

          {/* Quote Display */}
          {quote && (
            <>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 border border-blue-200 dark:border-slate-700">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                  {isComparisonMode ? 'Suggested Quote (Revised Script)' : 'Suggested Quote'}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Base Price:</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(quote.basePrice)}
                    </span>
                  </div>
                  
                  {quote.includesMinimumFee && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Minimum fee applied
                    </div>
                  )}
                  
                  <div className="h-px bg-blue-200 dark:bg-slate-700 my-2" />
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Recording:</span>
                    <span className="text-2xl font-black bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                      {formatCurrency(quote.finalPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-baseline pt-2 border-t border-blue-200 dark:border-slate-700">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Revision/Pickup:</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(quote.revisionPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client/Project Info for PDF */}
              <div className="space-y-3">
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
              </div>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
              >
                <Download size={16} />
                Download Quote PDF
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
