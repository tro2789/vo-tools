'use client';

import React, { useState, useEffect } from 'react';
import { calculateSpokenWordCount, formatDuration } from '@/utils/textAnalysis';
import { Clock, Type, Settings2, Info, Mic } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const DEFAULT_WPM = 150;
const MIN_WPM = 75;
const MAX_WPM = 160;

export const ScriptCalculator = () => {
  const [script, setScript] = useState<string>('');
  const [wpm, setWpm] = useState<number>(DEFAULT_WPM);
  const [wordCount, setWordCount] = useState<number>(0);
  const [timeEstimate, setTimeEstimate] = useState<string>('0 sec');

  useEffect(() => {
    const count = calculateSpokenWordCount(script);
    setWordCount(count);
    const minutes = count / (wpm || 1);
    setTimeEstimate(formatDuration(minutes));
  }, [script, wpm]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2 text-white shadow-lg shadow-blue-500/20">
              <Mic size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                ScriptTimer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Voiceover Estimator
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="w-full max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[70vh] lg:h-[80vh] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-6 sticky top-24">
            
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
                 Estimated Time
               </div>
              <div className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight tabular-nums">
                {timeEstimate}
              </div>
            </div>

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
          </div>
        </div>
      </main>
    </div>
  );
};