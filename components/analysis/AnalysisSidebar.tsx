import React from 'react';
import { Info, Clock, Pause } from 'lucide-react';
import { PauseAnalysis } from '@/utils/pauseDetection';
import { SpeedControl } from './SpeedControl';
import { ExpansionSettings } from '../settings/ExpansionSettings';
import { PricingSection } from '../pricing/PricingSection';
import { ExpansionOptions } from '@/utils/expansionOptions';
import { PricingConfig, QuoteResult } from '@/utils/pricingTypes';

interface AnalysisSidebarProps {
  wordCount: number;
  timeEstimate: string;
  pauseAnalysis: PauseAnalysis;
  timeWithPauses: string;
  wpm: number;
  setWpm: (wpm: number) => void;
  expansionOptions: ExpansionOptions;
  showExpansionSettings: boolean;
  setShowExpansionSettings: (show: boolean) => void;
  toggleExpansionOption: (key: keyof ExpansionOptions) => void;
  pricingConfig: PricingConfig;
  updatePricingConfig: <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) => void;
  showPricing: boolean;
  setShowPricing: (show: boolean) => void;
  quote: QuoteResult | null;
  clientName: string;
  setClientName: (name: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  handleDownloadPDF: () => void;
}

export const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({
  wordCount,
  timeEstimate,
  pauseAnalysis,
  timeWithPauses,
  wpm,
  setWpm,
  expansionOptions,
  showExpansionSettings,
  setShowExpansionSettings,
  toggleExpansionOption,
  pricingConfig,
  updatePricingConfig,
  showPricing,
  setShowPricing,
  quote,
  clientName,
  setClientName,
  projectName,
  setProjectName,
  handleDownloadPDF
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin">
      
      <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Info size={14} />
        Analysis
      </h2>

      {/* Word Count */}
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">Spoken Word Count</div>
        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
          {wordCount}
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-6" />

      {/* Time Estimate */}
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
          <Clock size={12} />
          Reading Time (Words Only)
        </div>
        <div className="text-3xl font-bold text-slate-700 dark:text-slate-300 tracking-tight tabular-nums">
          {timeEstimate}
        </div>
      </div>

      {/* Pause Information */}
      {pauseAnalysis.pauseCount > 0 && (
        <>
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/40 mb-6">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
              <Pause size={12} />
              Detected Pauses
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">
              +{pauseAnalysis.totalPauseTime.toFixed(1)}s
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {pauseAnalysis.pauseCount} pauses detected
            </div>
          </div>

          <div className="mb-8">
            <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
              <Clock size={12} />
              Total Time (with Pauses)
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight tabular-nums">
              {timeWithPauses}
            </div>
          </div>
        </>
      )}

      {pauseAnalysis.pauseCount === 0 && (
        <div className="mb-8">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
            <Clock size={12} />
            Total Time
          </div>
          <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight tabular-nums">
            {timeEstimate}
          </div>
        </div>
      )}

      {/* Speed Control */}
      <SpeedControl wpm={wpm} setWpm={setWpm} />

      {/* Expansion Options */}
      <div className="mt-6">
        <ExpansionSettings
          showExpansionSettings={showExpansionSettings}
          setShowExpansionSettings={setShowExpansionSettings}
          expansionOptions={expansionOptions}
          toggleExpansionOption={toggleExpansionOption}
        />
      </div>

      {/* Pricing & Quote Section */}
      <div className="mt-6">
        <PricingSection
          showPricing={showPricing}
          setShowPricing={setShowPricing}
          pricingConfig={pricingConfig}
          updatePricingConfig={updatePricingConfig}
          quote={quote}
          clientName={clientName}
          setClientName={setClientName}
          projectName={projectName}
          setProjectName={setProjectName}
          handleDownloadPDF={handleDownloadPDF}
        />
      </div>
    </div>
  );
};
