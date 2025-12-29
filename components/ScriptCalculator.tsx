'use client';

import React, { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { Mic, GitCompare, FileText, Heart, RotateCcw, MessageCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ScriptEditor } from './editor/ScriptEditor';
import { AnalysisSidebar } from './analysis/AnalysisSidebar';
import { SpeedControl } from './analysis/SpeedControl';
import { ExpansionSettings } from './settings/ExpansionSettings';
import { PricingSection } from './pricing/PricingSection';
import AutosaveIndicator from './AutosaveIndicator';
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
      localStorage.clear();
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
    // Set a flag in sessionStorage to indicate we're resetting
    sessionStorage.setItem('vo-tools-resetting', 'true');
    
    // Reload the page - the useEffect on mount will handle clearing localStorage
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-blue-600 rounded-lg p-1.5 md:p-2 text-white shadow-lg shadow-blue-500/20">
              <Mic size={18} className="md:w-5 md:h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              VO Tools
            </h1>
            <AutosaveIndicator lastSaved={lastSaved} hasUnsavedChanges={hasUnsavedChanges} />
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
              title="Reset all data to defaults"
            >
              <RotateCcw size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={toggleComparisonMode}
              className={`flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${
                comparisonMode
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {comparisonMode ? <GitCompare size={14} className="md:w-4 md:h-4" /> : <FileText size={14} className="md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{comparisonMode ? 'Compare' : 'Single'}</span>
            </button>
            <ThemeToggle />
            <a
              href="https://discord.gg/gYg69PbHfR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              title="Join our Discord community"
            >
              <MessageCircle size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Discord</span>
            </a>
            <a
              href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20"
            >
              <Heart size={14} className="fill-current md:w-4 md:h-4" />
              <span className="hidden sm:inline">Buy Me A Coffee</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8">
        {!comparisonMode ? (
          // Single Mode Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Editor */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <ScriptEditor
                value={script}
                onChange={setScript}
                placeholder="Paste your script here... Numbers like '10,000' will be automatically expanded..."
              />
            </div>

            {/* Right Column: Analysis Sidebar */}
            <div className="lg:col-span-4 space-y-6">
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
          // Comparison Mode Layout
          <div className="space-y-6">
            {/* Stats Row */}
            <Suspense fallback={
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-8 text-center">
                <div className="text-slate-500 dark:text-slate-400">Loading comparison stats...</div>
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

            {/* Expansion Options */}
            <ExpansionSettings
              showExpansionSettings={showExpansionSettings}
              setShowExpansionSettings={setShowExpansionSettings}
              expansionOptions={expansionOptions}
              toggleExpansionOption={toggleExpansionOption}
            />

            {/* Pricing & Quote Section (Comparison Mode) */}
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

            {/* Side-by-Side Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScriptEditor
                value={originalScript}
                onChange={setOriginalScript}
                placeholder="Paste your original script here..."
                label="Original Script"
                height="h-[60vh]"
              />

              <ScriptEditor
                value={revisedScript}
                onChange={setRevisedScript}
                placeholder="Paste your revised script here..."
                label="Revised Script"
                height="h-[60vh]"
              />
            </div>

            {/* Diff Visualization */}
            {originalScript && revisedScript && comparison.diffSegments.originalSegments.length > 0 && (
              <Suspense fallback={
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-8 text-center">
                  <div className="text-slate-500 dark:text-slate-400">Loading diff visualization...</div>
                </div>
              }>
                <div className="space-y-6">
                  <DiffVisualization
                    originalSegments={comparison.diffSegments.originalSegments}
                    revisedSegments={comparison.diffSegments.revisedSegments}
                  />
                </div>
              </Suspense>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md mt-8 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Built with ❤️ for the voiceover community
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg/gYg69PbHfR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              Discord
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://gitea.tohareprod.com/tro2789/vo-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
              Source Code
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              Support Development
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
