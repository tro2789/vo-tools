'use client';

import React, { useState, useEffect } from 'react';
import { calculateSpokenWordCount, formatDuration, analyzePauses, calculateTotalTimeWithPauses } from '@/utils/textAnalysis';
import { compareTexts, DiffSegment } from '@/utils/textComparison';
import { PauseAnalysis } from '@/utils/pauseDetection';
import { ExpansionOptions, DEFAULT_EXPANSION_OPTIONS, EXPANSION_LABELS, EXPANSION_DESCRIPTIONS } from '@/utils/expansionOptions';
import { PricingConfig, DEFAULT_PRICING_CONFIG, QuoteResult, calculateQuote, formatCurrency, getPricingModelName, PricingModel } from '@/utils/pricingTypes';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { Clock, Type, Settings2, Info, Mic, GitCompare, FileText, Pause, Sparkles, Heart, DollarSign, Download } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';

const DEFAULT_WPM = 150;
const MIN_WPM = 75;
const MAX_WPM = 160;

export const ScriptCalculator = () => {
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [script, setScript] = useState<string>('');
  const [originalScript, setOriginalScript] = useState<string>('');
  const [revisedScript, setRevisedScript] = useState<string>('');
  const [wpm, setWpm] = useState<number>(DEFAULT_WPM);
  const [expansionOptions, setExpansionOptions] = useState<ExpansionOptions>(DEFAULT_EXPANSION_OPTIONS);
  const [showExpansionSettings, setShowExpansionSettings] = useState<boolean>(false);
  
  // Pricing state
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [showPricing, setShowPricing] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  
  const [wordCount, setWordCount] = useState<number>(0);
  const [timeEstimate, setTimeEstimate] = useState<string>('0 sec');
  const [pauseAnalysis, setPauseAnalysis] = useState<PauseAnalysis>({ pauses: [], totalPauseTime: 0, pauseCount: 0 });
  const [timeWithPauses, setTimeWithPauses] = useState<string>('0 sec');
  
  // Comparison mode stats
  const [originalWordCount, setOriginalWordCount] = useState<number>(0);
  const [revisedWordCount, setRevisedWordCount] = useState<number>(0);
  const [originalTimeEstimate, setOriginalTimeEstimate] = useState<string>('0 sec');
  const [revisedTimeEstimate, setRevisedTimeEstimate] = useState<string>('0 sec');
  const [originalPauseAnalysis, setOriginalPauseAnalysis] = useState<PauseAnalysis>({ pauses: [], totalPauseTime: 0, pauseCount: 0 });
  const [revisedPauseAnalysis, setRevisedPauseAnalysis] = useState<PauseAnalysis>({ pauses: [], totalPauseTime: 0, pauseCount: 0 });
  const [originalTimeWithPauses, setOriginalTimeWithPauses] = useState<string>('0 sec');
  const [revisedTimeWithPauses, setRevisedTimeWithPauses] = useState<string>('0 sec');
  const [diffSegments, setDiffSegments] = useState<{
    originalSegments: DiffSegment[];
    revisedSegments: DiffSegment[];
  }>({ originalSegments: [], revisedSegments: [] });

  // Single mode calculations
  useEffect(() => {
    if (!comparisonMode) {
      const count = calculateSpokenWordCount(script, expansionOptions);
      setWordCount(count);
      const minutes = count / (wpm || 1);
      setTimeEstimate(formatDuration(minutes));
      
      // Analyze pauses
      const pauseData = analyzePauses(script);
      setPauseAnalysis(pauseData);
      
      // Calculate time with pauses
      const totalMinutes = calculateTotalTimeWithPauses(count, wpm, pauseData.totalPauseTime);
      setTimeWithPauses(formatDuration(totalMinutes));
    }
  }, [script, wpm, comparisonMode, expansionOptions]);

  // Comparison mode calculations
  useEffect(() => {
    if (comparisonMode) {
      const origCount = calculateSpokenWordCount(originalScript, expansionOptions);
      const revCount = calculateSpokenWordCount(revisedScript, expansionOptions);
      
      setOriginalWordCount(origCount);
      setRevisedWordCount(revCount);
      
      // Analyze pauses for both scripts
      const origPauseData = analyzePauses(originalScript);
      const revPauseData = analyzePauses(revisedScript);
      setOriginalPauseAnalysis(origPauseData);
      setRevisedPauseAnalysis(revPauseData);
      
      const origMinutes = origCount / (wpm || 1);
      const revMinutes = revCount / (wpm || 1);
      
      setOriginalTimeEstimate(formatDuration(origMinutes));
      setRevisedTimeEstimate(formatDuration(revMinutes));
      
      // Calculate time with pauses
      const origTotalMinutes = calculateTotalTimeWithPauses(origCount, wpm, origPauseData.totalPauseTime);
      const revTotalMinutes = calculateTotalTimeWithPauses(revCount, wpm, revPauseData.totalPauseTime);
      setOriginalTimeWithPauses(formatDuration(origTotalMinutes));
      setRevisedTimeWithPauses(formatDuration(revTotalMinutes));
      
      // Compute diff
      const diff = compareTexts(originalScript, revisedScript);
      setDiffSegments(diff);
    }
  }, [originalScript, revisedScript, wpm, comparisonMode, expansionOptions]);

  // Calculate quote when pricing config or stats change
  useEffect(() => {
    if (!comparisonMode && wordCount > 0) {
      const readingMinutes = wordCount / (wpm || 1);
      const calculatedQuote = calculateQuote(
        wordCount,
        readingMinutes,
        timeEstimate,
        pricingConfig
      );
      setQuote(calculatedQuote);
    } else if (comparisonMode && revisedWordCount > 0) {
      // Use revised script stats for comparison mode
      const readingMinutes = revisedWordCount / (wpm || 1);
      const calculatedQuote = calculateQuote(
        revisedWordCount,
        readingMinutes,
        revisedTimeEstimate,
        pricingConfig
      );
      setQuote(calculatedQuote);
    } else {
      setQuote(null);
    }
  }, [wordCount, timeEstimate, revisedWordCount, revisedTimeEstimate, pricingConfig, comparisonMode, wpm]);

  const toggleExpansionOption = (key: keyof ExpansionOptions) => {
    setExpansionOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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

  const toggleComparisonMode = () => {
    if (!comparisonMode) {
      // Switching to comparison mode - preserve current script as original
      setOriginalScript(script);
      setRevisedScript('');
    }
    setComparisonMode(!comparisonMode);
  };

  const renderDiffText = (segments: DiffSegment[]) => {
    return segments.map((segment, index) => {
      const isWhitespace = /^\s+$/.test(segment.value);
      
      if (segment.type === 'unchanged') {
        return (
          <span key={index} className="text-slate-700 dark:text-slate-300">
            {segment.value}
          </span>
        );
      } else if (segment.type === 'added') {
        return (
          <span
            key={index}
            className={`bg-green-200 dark:bg-green-900/40 text-green-900 dark:text-green-200 ${
              isWhitespace ? '' : 'rounded px-0.5'
            }`}
          >
            {segment.value}
          </span>
        );
      } else if (segment.type === 'removed') {
        return (
          <span
            key={index}
            className={`bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through ${
              isWhitespace ? '' : 'rounded px-0.5'
            }`}
          >
            {segment.value}
          </span>
        );
      }
    });
  };

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
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3">
            <a
              href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20"
            >
              <Heart size={14} className="fill-current md:w-4 md:h-4" />
              <span className="hidden sm:inline">Tip</span>
            </a>
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
          </div>
        </div>
      </nav>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8">
        {!comparisonMode ? (
          // Single Mode Layout
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Editor */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[50vh] lg:h-[80vh] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
                {/* Toolbar */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Type size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Script Input</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {script.length} chars
                  </div>
                </div>

                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Paste your script here... Numbers like '10,000' will be automatically expanded..."
                  className="flex-1 w-full p-6 resize-none bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Right Column: Stats Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin">
                
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Info size={14} />
                  Analysis
                </h2>

                {/* Word Count */}
                <div className="mb-8">
                  <div className="text-xs font-medium text-slate-500 mb-1">Spoken Word Count</div>
                  <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                    {wordCount}
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-6" />

                {/* Time Estimate */}
                <div className="mb-8">
                  <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
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
                      <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        Total Time (with Pauses)
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight tabular-nums">
                        {timeWithPauses}
                      </div>
                    </div>
                  </>
                )}

                {pauseAnalysis.pauseCount === 0 && (
                  <div className="mb-8">
                    <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Clock size={12} />
                      Total Time
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight tabular-nums">
                      {timeEstimate}
                    </div>
                  </div>
                )}

                {/* Speed Control */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Settings2 size={16} />
                      Reading Speed
                    </label>
                    <span className="text-xs font-mono font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                      {wpm} WPM
                    </span>
                  </div>

                  <input
                    type="range"
                    min={MIN_WPM}
                    max={MAX_WPM}
                    value={wpm}
                    onChange={(e) => setWpm(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  
                  <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <span>Slow ({MIN_WPM})</span>
                    <span>Fast ({MAX_WPM})</span>
                  </div>
                </div>

                {/* Expansion Options */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
                  <button
                    onClick={() => setShowExpansionSettings(!showExpansionSettings)}
                    className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} />
                      Expansion Settings
                    </span>
                    <span className={`text-slate-400 transition-transform ${showExpansionSettings ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {showExpansionSettings && (
                    <div className="px-5 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                      {(Object.keys(expansionOptions) as Array<keyof ExpansionOptions>).map((key) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={expansionOptions[key]}
                            onChange={() => toggleExpansionOption(key)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {EXPANSION_LABELS[key]}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {EXPANSION_DESCRIPTIONS[key]}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing & Quote Section */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
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
                              Suggested Quote
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
              </div>
            </div>
          </div>
        ) : (
          // Comparison Mode Layout
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Original Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Original Script
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {originalWordCount}
                  </div>
                  <div className="text-xs text-slate-500">words</div>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  {originalTimeEstimate}
                </div>
                {originalPauseAnalysis.pauseCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Pause size={10} />
                      +{originalPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
                    </div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                      {originalTimeWithPauses} total
                    </div>
                  </div>
                )}
              </div>

              {/* Difference Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl shadow-sm border border-blue-200 dark:border-slate-700 p-5">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                  Difference
                </div>
                <div className="flex items-baseline gap-3">
                  <div className={`text-3xl font-black tabular-nums ${
                    revisedWordCount - originalWordCount > 0
                      ? 'text-green-600 dark:text-green-400'
                      : revisedWordCount - originalWordCount < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500'
                  }`}>
                    {revisedWordCount - originalWordCount > 0 ? '+' : ''}
                    {revisedWordCount - originalWordCount}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">words</div>
                </div>
                <div className={`text-sm font-semibold mt-2 tabular-nums ${
                  revisedWordCount - originalWordCount > 0
                    ? 'text-green-600 dark:text-green-400'
                    : revisedWordCount - originalWordCount < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500'
                }`}>
                  {((revisedWordCount - originalWordCount) / (wpm || 1) * 60).toFixed(0)}s reading
                </div>
                {(originalPauseAnalysis.pauseCount > 0 || revisedPauseAnalysis.pauseCount > 0) && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-slate-700">
                    <div className={`text-xs font-semibold flex items-center gap-1 ${
                      revisedPauseAnalysis.totalPauseTime - originalPauseAnalysis.totalPauseTime > 0
                        ? 'text-green-600 dark:text-green-400'
                        : revisedPauseAnalysis.totalPauseTime - originalPauseAnalysis.totalPauseTime < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500'
                    }`}>
                      <Pause size={10} />
                      {revisedPauseAnalysis.totalPauseTime - originalPauseAnalysis.totalPauseTime > 0 ? '+' : ''}
                      {(revisedPauseAnalysis.totalPauseTime - originalPauseAnalysis.totalPauseTime).toFixed(1)}s pauses
                    </div>
                  </div>
                )}
              </div>

              {/* Revised Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Revised Script
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {revisedWordCount}
                  </div>
                  <div className="text-xs text-slate-500">words</div>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                  {revisedTimeEstimate}
                </div>
                {revisedPauseAnalysis.pauseCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Pause size={10} />
                      +{revisedPauseAnalysis.totalPauseTime.toFixed(1)}s pauses
                    </div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                      {revisedTimeWithPauses} total
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Speed Control */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <Settings2 size={16} />
                  Reading Speed
                </label>
                <span className="text-xs font-mono font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                  {wpm} WPM
                </span>
              </div>

              <input
                type="range"
                min={MIN_WPM}
                max={MAX_WPM}
                value={wpm}
                onChange={(e) => setWpm(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                <span>Slow ({MIN_WPM})</span>
                <span>Fast ({MAX_WPM})</span>
              </div>
            </div>

            {/* Expansion Options */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
              <button
                onClick={() => setShowExpansionSettings(!showExpansionSettings)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} />
                  Expansion Settings
                </span>
                <span className={`text-slate-400 transition-transform ${showExpansionSettings ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showExpansionSettings && (
                <div className="px-5 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {(Object.keys(expansionOptions) as Array<keyof ExpansionOptions>).map((key) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={expansionOptions[key]}
                        onChange={() => toggleExpansionOption(key)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {EXPANSION_LABELS[key]}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {EXPANSION_DESCRIPTIONS[key]}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Quote Section (Comparison Mode) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
              <button
                onClick={() => setShowPricing(!showPricing)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
                          Suggested Quote (Revised Script)
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

            {/* Side-by-Side Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Script Input */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[60vh] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Type size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Original Script</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {originalScript.length} chars
                  </div>
                </div>

                <textarea
                  value={originalScript}
                  onChange={(e) => setOriginalScript(e.target.value)}
                  placeholder="Paste your original script here..."
                  className="flex-1 w-full p-6 resize-none bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  spellCheck={false}
                />
              </div>

              {/* Revised Script Input */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[60vh] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Type size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Revised Script</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {revisedScript.length} chars
                  </div>
                </div>

                <textarea
                  value={revisedScript}
                  onChange={(e) => setRevisedScript(e.target.value)}
                  placeholder="Paste your revised script here..."
                  className="flex-1 w-full p-6 resize-none bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Diff Visualization */}
            {originalScript && revisedScript && diffSegments.originalSegments.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Difference Visualization
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original with Highlights */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Type size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Original (with deletions)</span>
                      </div>
                    </div>
                    <div className="p-6 max-h-[40vh] overflow-y-auto text-lg leading-relaxed">
                      {renderDiffText(diffSegments.originalSegments)}
                    </div>
                  </div>

                  {/* Revised with Highlights */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Type size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Revised (with additions)</span>
                      </div>
                    </div>
                    <div className="p-6 max-h-[40vh] overflow-y-auto text-lg leading-relaxed">
                      {renderDiffText(diffSegments.revisedSegments)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-5">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Legend
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-green-200 dark:bg-green-900/40 text-green-900 dark:text-green-200 px-2 py-1 rounded text-sm">
                    Added
                  </span>
                  <span className="text-xs text-slate-500">New text in revised</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through px-2 py-1 rounded text-sm">
                    Removed
                  </span>
                  <span className="text-xs text-slate-500">Deleted from original</span>
                </div>
              </div>
            </div>
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
