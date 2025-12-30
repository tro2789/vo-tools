'use client';

import React, { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { GitCompare, FileText, RotateCcw } from 'lucide-react';
import { Footer } from './Footer';
import { ScriptEditor } from './editor/ScriptEditor';
import { AnalysisSidebar } from './analysis/AnalysisSidebar';
import { SpeedControl } from './analysis/SpeedControl';
import { ExpansionSettings } from './settings/ExpansionSettings';
import { PricingSection } from './pricing/PricingSection';
import { useScriptAnalysis } from '@/hooks/useScriptAnalysis';
import { useComparison } from '@/hooks/useComparison';
import { usePricing } from '@/hooks/usePricing';
import { useExpansionOptions } from '@/hooks/useExpansionOptions';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAutosave } from '@/hooks/useAutosave';
import { ExpansionOptions } from '@/utils/expansionOptions';
import { PricingConfig } from '@/utils/pricingTypes';

// Lazy load comparison components (only loaded when comparison mode is activated)
const ComparisonStats = lazy(() => import('./comparison/ComparisonStats').then(m => ({ default: m.ComparisonStats })));
const DiffVisualization = lazy(() => import('./comparison/DiffVisualization').then(m => ({ default: m.DiffVisualization })));

const DEFAULT_WPM = 150;
const MIN_WPM = 75;
const MAX_WPM = 160;

// Interface for persisted state
interface PersistedState {
  script: string;
  originalScript: string;
  revisedScript: string;
  comparisonMode: boolean;
  wpm: number;
  expansionOptions: ExpansionOptions;
  pricingConfig: PricingConfig;
  clientName: string;
  projectName: string;
  showPricing: boolean;
  showExpansionSettings: boolean;
}

export const ScriptCalculator = () => {
  // Clear localStorage BEFORE any state initialization if resetting flag is set
  // This must happen synchronously before useState runs
  if (typeof window !== 'undefined') {
    const isResetting = sessionStorage.getItem('vo-tools-resetting');
    if (isResetting === 'true') {
      sessionStorage.removeItem('vo-tools-resetting');
      // Only remove app-specific localStorage items, preserve theme preference
      localStorage.removeItem('vo-tools-state');
    }
  }

  // Load persisted state from localStorage
  const [persistedState, setPersistedState, clearPersistedState] = useLocalStorage<PersistedState | null>(
    'vo-tools-state',
    null
  );

  // Mode state
  const [comparisonMode, setComparisonMode] = useState<boolean>(
    persistedState?.comparisonMode ?? false
  );
  
  // Script content state (immediate for responsive typing)
  const [script, setScript] = useState<string>(persistedState?.script ?? '');
  const [originalScript, setOriginalScript] = useState<string>(
    persistedState?.originalScript ?? ''
  );
  const [revisedScript, setRevisedScript] = useState<string>(
    persistedState?.revisedScript ?? ''
  );
  const [wpm, setWpm] = useState<number>(persistedState?.wpm ?? DEFAULT_WPM);

  // Debounced versions for expensive calculations (300ms delay)
  const debouncedScript = useDebounce(script, 300);
  const debouncedOriginalScript = useDebounce(originalScript, 300);
  const debouncedRevisedScript = useDebounce(revisedScript, 300);

  // Custom hooks for business logic
  const expansionHook = useExpansionOptions(persistedState?.expansionOptions);
  const { expansionOptions, showExpansionSettings, setShowExpansionSettings, toggleExpansionOption } = expansionHook;

  // Single mode analysis (using debounced text)
  const singleAnalysis = useScriptAnalysis(debouncedScript, wpm, expansionOptions);

  // Comparison mode analysis (using debounced text)
  const originalAnalysis = useScriptAnalysis(debouncedOriginalScript, wpm, expansionOptions);
  const revisedAnalysis = useScriptAnalysis(debouncedRevisedScript, wpm, expansionOptions);
  const comparison = useComparison(debouncedOriginalScript, debouncedRevisedScript);

  // Pricing (uses revised script in comparison mode, single script otherwise)
  const activeWordCount = comparisonMode ? revisedAnalysis.wordCount : singleAnalysis.wordCount;
  const activeTimeEstimate = comparisonMode ? revisedAnalysis.timeEstimate : singleAnalysis.timeEstimate;
  
  const pricingHook = usePricing(
    activeWordCount,
    wpm,
    activeTimeEstimate,
    persistedState?.pricingConfig,
    persistedState?.clientName,
    persistedState?.projectName,
    persistedState?.showPricing
  );
  const {
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
  } = pricingHook;

  // Autosave function - saves current state to localStorage
  const saveState = useCallback(() => {
    const currentState: PersistedState = {
      script,
      originalScript,
      revisedScript,
      comparisonMode,
      wpm,
      expansionOptions,
      pricingConfig,
      clientName,
      projectName,
      showPricing,
      showExpansionSettings,
    };
    setPersistedState(currentState);
  }, [
    script,
    originalScript,
    revisedScript,
    comparisonMode,
    wpm,
    expansionOptions,
    pricingConfig,
    clientName,
    projectName,
    showPricing,
    showExpansionSettings,
    setPersistedState,
  ]);

  // Autosave hook - saves every 30 seconds when changes are detected
  const { lastSaved, saveNow, hasUnsavedChanges } = useAutosave(
    {
      script,
      originalScript,
      revisedScript,
      comparisonMode,
      wpm,
      expansionOptions,
      pricingConfig,
      clientName,
      projectName,
      showPricing,
      showExpansionSettings,
    },
    saveState,
    30000 // 30 seconds
  );

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    if (!comparisonMode) {
      // Switching to comparison mode - preserve current script as original
      setOriginalScript(script);
      setRevisedScript('');
    }
    setComparisonMode(!comparisonMode);
  };

  // Reset all data to defaults - immediate reset with no confirmation
  const handleReset = useCallback(() => {
    // Clear only app-specific state, preserve theme preference
    localStorage.removeItem('vo-tools-state');
    
    // Reload the page to reset all state
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Page Header - Secondary controls specific to Script Analysis */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Script Analysis
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Analyze scripts for word count, timing, and pricing
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                title="Reset all data to defaults"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={toggleComparisonMode}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  comparisonMode
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {comparisonMode ? <GitCompare size={16} /> : <FileText size={16} />}
                <span className="hidden sm:inline">{comparisonMode ? 'Compare' : 'Single'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4">
        {!comparisonMode ? (
          // Single Mode Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Editor */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <ScriptEditor
                value={script}
                onChange={setScript}
                placeholder="Paste your script here... Numbers like '10,000' will be automatically expanded..."
              />
            </div>

            {/* Right Column: Analysis Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <AnalysisSidebar
                wordCount={singleAnalysis.wordCount}
                timeEstimate={singleAnalysis.timeEstimate}
                pauseAnalysis={singleAnalysis.pauseAnalysis}
                timeWithPauses={singleAnalysis.timeWithPauses}
                wpm={wpm}
                setWpm={setWpm}
                expansionOptions={expansionOptions}
                showExpansionSettings={showExpansionSettings}
                setShowExpansionSettings={setShowExpansionSettings}
                toggleExpansionOption={toggleExpansionOption}
                pricingConfig={pricingConfig}
                updatePricingConfig={updatePricingConfig}
                showPricing={showPricing}
                setShowPricing={setShowPricing}
                quote={quote}
                clientName={clientName}
                setClientName={setClientName}
                projectName={projectName}
                setProjectName={setProjectName}
                handleDownloadPDF={handleDownloadPDF}
              />
            </div>
          </div>
        ) : (
          // Comparison Mode Layout - Similar to Single Mode
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Stacked Editors */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <ScriptEditor
                value={originalScript}
                onChange={setOriginalScript}
                placeholder="Paste your original script here..."
                label="Original Script"
                height="h-[32vh]"
              />

              <ScriptEditor
                value={revisedScript}
                onChange={setRevisedScript}
                placeholder="Paste your revised script here..."
                label="Revised Script"
                height="h-[32vh]"
              />

              {/* Diff Visualization below editors */}
              {originalScript && revisedScript && comparison.diffSegments.originalSegments.length > 0 && (
                <Suspense fallback={
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-8 text-center">
                    <div className="text-slate-500 dark:text-slate-400">Loading diff visualization...</div>
                  </div>
                }>
                  <DiffVisualization
                    originalSegments={comparison.diffSegments.originalSegments}
                    revisedSegments={comparison.diffSegments.revisedSegments}
                  />
                </Suspense>
              )}
            </div>

            {/* Right Column: Stats and Controls */}
            <div className="lg:col-span-4 space-y-4">
              {/* Comparison Stats */}
              <Suspense fallback={
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-8 text-center">
                  <div className="text-slate-500 dark:text-slate-400">Loading stats...</div>
                </div>
              }>
                <ComparisonStats
                  originalWordCount={originalAnalysis.wordCount}
                  revisedWordCount={revisedAnalysis.wordCount}
                  originalTimeEstimate={originalAnalysis.timeEstimate}
                  revisedTimeEstimate={revisedAnalysis.timeEstimate}
                  originalPauseAnalysis={originalAnalysis.pauseAnalysis}
                  revisedPauseAnalysis={revisedAnalysis.pauseAnalysis}
                  originalTimeWithPauses={originalAnalysis.timeWithPauses}
                  revisedTimeWithPauses={revisedAnalysis.timeWithPauses}
                  wpm={wpm}
                />
              </Suspense>

              {/* Speed Control */}
              <SpeedControl wpm={wpm} setWpm={setWpm} minWpm={MIN_WPM} maxWpm={MAX_WPM} />

              {/* Expansion Settings */}
              <ExpansionSettings
                showExpansionSettings={showExpansionSettings}
                setShowExpansionSettings={setShowExpansionSettings}
                expansionOptions={expansionOptions}
                toggleExpansionOption={toggleExpansionOption}
              />

              {/* Pricing Section */}
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
                isComparisonMode={true}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
