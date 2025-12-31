'use client';

import React, { useState, useCallback } from 'react';
import { TeleprompterDisplay } from './TeleprompterDisplay';
import { ScriptEditorWithPronunciation } from '@/components/editor/ScriptEditorWithPronunciation';
import { useTeleprompter } from '@/hooks/useTeleprompter';
import { useScriptAnalysis } from '@/hooks/useScriptAnalysis';
import { DEFAULT_EXPANSION_OPTIONS } from '@/utils/expansionOptions';

interface TeleprompterContainerProps {
  initialScript?: string;
  initialWpm?: number;
}

const DEFAULT_WPM = 150;

export const TeleprompterContainer: React.FC<TeleprompterContainerProps> = ({
  initialScript = '',
  initialWpm = DEFAULT_WPM,
}) => {
  // Check sessionStorage for script from Script Analysis tool
  const [script, setScript] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedScript = sessionStorage.getItem('teleprompter-script');
      if (storedScript) {
        sessionStorage.removeItem('teleprompter-script');
        return storedScript;
      }
    }
    return initialScript;
  });

  const [wpm, setWpm] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedWpm = sessionStorage.getItem('teleprompter-wpm');
      if (storedWpm) {
        sessionStorage.removeItem('teleprompter-wpm');
        return parseInt(storedWpm, 10);
      }
    }
    return initialWpm;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Analyze script to get word count for timing
  const { wordCount } = useScriptAnalysis(script, wpm, DEFAULT_EXPANSION_OPTIONS);

  // Exit fullscreen
  const handleExit = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Teleprompter hook
  const teleprompter = useTeleprompter({
    wpm,
    totalWords: wordCount,
    onExit: handleExit,
  });

  // Start teleprompter (enter fullscreen mode)
  const handleStart = () => {
    if (script.trim()) {
      teleprompter.reset();
      setIsFullscreen(true);
    }
  };

  if (isFullscreen && script) {
    return (
      <TeleprompterDisplay
        script={script}
        isPlaying={teleprompter.isPlaying}
        scrollPosition={teleprompter.scrollPosition}
        speedMultiplier={teleprompter.speedMultiplier}
        textSize={teleprompter.textSize}
        isMirrored={teleprompter.isMirrored}
        elapsedTime={teleprompter.elapsedTime}
        estimatedTotalTime={teleprompter.estimatedTotalTime}
        onTogglePlayPause={teleprompter.togglePlayPause}
        onAdjustSpeed={teleprompter.adjustSpeed}
        onAdjustTextSize={teleprompter.adjustTextSize}
        onToggleMirror={teleprompter.toggleMirror}
        onReset={teleprompter.reset}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Page Header - Secondary controls specific to Teleprompter */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Teleprompter
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Professional teleprompter with auto-scroll, speed control, and studio-ready features
            </p>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Setup Interface */}
          <div className="space-y-6">
          {/* Script Input */}
          <div className="space-y-2">
            <ScriptEditorWithPronunciation
              value={script}
              onChange={setScript}
              placeholder="Paste your script here..."
              label="Script Text"
              height="h-64"
              showPronunciationToggle={true}
            />
            <div className="text-sm text-slate-500 dark:text-slate-400 px-1">
              {wordCount} words • Estimated {Math.ceil((wordCount / wpm) * 60)} seconds
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reading Speed (WPM)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="75"
                max="200"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="75"
                max="200"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
              />
            </div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This determines the base scrolling speed. You can adjust it in real-time during playback.
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!script.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
          >
            Start Teleprompter
          </button>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Keyboard Controls
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-blue-300 dark:border-blue-600 font-mono text-xs">
                  Space
                </kbd>{' '}
                Play / Pause
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-blue-300 dark:border-blue-600 font-mono text-xs">
                  ↑ ↓
                </kbd>{' '}
                Adjust Speed
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-blue-300 dark:border-blue-600 font-mono text-xs">
                  Home
                </kbd>{' '}
                Reset to Start
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-blue-300 dark:border-blue-600 font-mono text-xs">
                  Esc
                </kbd>{' '}
                Exit Fullscreen
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};
