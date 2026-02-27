'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { QRCodeCanvas } from '@/components/QRCode';
import { TeleprompterDisplay } from './TeleprompterDisplay';
import { ScriptEditorWithPronunciation } from '@/components/editor/ScriptEditorWithPronunciation';
import { useTeleprompter } from '@/hooks/useTeleprompter';
import { useScriptAnalysis } from '@/hooks/useScriptAnalysis';
import { useRemoteControl } from '@/hooks/useRemoteControl';
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

  // Handle remote commands
  const handleRemoteCommand = useCallback((action: string, value?: number) => {
    switch (action) {
      case 'play':
        if (!teleprompter.isPlaying) teleprompter.togglePlayPause();
        break;
      case 'pause':
        if (teleprompter.isPlaying) teleprompter.togglePlayPause();
        break;
      case 'toggle':
        teleprompter.togglePlayPause();
        break;
      case 'faster':
        teleprompter.adjustSpeed(0.1);
        break;
      case 'slower':
        teleprompter.adjustSpeed(-0.1);
        break;
      case 'restart':
        teleprompter.reset();
        break;
      case 'textBigger':
        teleprompter.adjustTextSize(1);
        break;
      case 'textSmaller':
        teleprompter.adjustTextSize(-1);
        break;
      case 'toggleMirror':
        teleprompter.toggleMirror();
        break;
      case 'setSpeed':
        if (value !== undefined) {
          // Set speed directly (would need to add this to teleprompter hook)
          teleprompter.adjustSpeed(value - teleprompter.speedMultiplier);
        }
        break;
      case 'scrollTo':
        if (value !== undefined) {
          // Scroll to position (would need to add this to teleprompter hook)
          // For now, just log it
          console.log('Scroll to:', value);
        }
        break;
    }
  }, [teleprompter]);

  // Remote control hook
  const remote = useRemoteControl(handleRemoteCommand);

  // Sync state to phone when it changes
  useEffect(() => {
    if (remote.phoneConnected && isFullscreen) {
      const progress = teleprompter.elapsedTime / (teleprompter.estimatedTotalTime || 1);
      remote.syncState({
        isPlaying: teleprompter.isPlaying,
        speed: teleprompter.speedMultiplier,
        progress: Math.min(progress, 1),
        textSize: teleprompter.textSize,
        isMirrored: teleprompter.isMirrored,
      });
    }
  }, [
    remote,
    isFullscreen,
    teleprompter.isPlaying,
    teleprompter.speedMultiplier,
    teleprompter.elapsedTime,
    teleprompter.estimatedTotalTime,
    teleprompter.textSize,
    teleprompter.isMirrored,
  ]);

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
    <div className="min-h-screen w-full bg-gray-50 dark:bg-[#000d15] transition-colors duration-300">

      {/* Page Header - Secondary controls specific to Teleprompter */}
      <div className="w-full border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#072030]/80 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Teleprompter
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
            <div className="text-sm text-gray-500 dark:text-gray-400 px-1">
              {wordCount} words • Estimated {Math.ceil((wordCount / wpm) * 60)} seconds
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800/60 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#072030] text-gray-900 dark:text-white text-center"
              />
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This determines the base scrolling speed. You can adjust it in real-time during playback.
            </div>
          </div>

          {/* Remote Control Panel */}
          {remote.remoteUrl && (
            <div className="bg-linear-to-br from-cyan-50 to-gray-50 dark:from-cyan-950/20 dark:to-gray-900/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg shadow-md">
                    <QRCodeCanvas
                      value={remote.remoteUrl}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-cyan-500 dark:text-cyan-500" />
                    <h3 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                      Phone Remote Control
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-800 dark:text-cyan-200">
                        Room Code:
                      </span>
                      <code className="px-2 py-1 bg-white dark:bg-gray-700 rounded-sm font-mono font-bold text-cyan-900 dark:text-cyan-100 border border-cyan-300 dark:border-cyan-600">
                        {remote.roomCode}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      {remote.phoneConnected ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            Phone Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Waiting for phone...
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-cyan-600 dark:text-cyan-300 text-xs pt-1">
                      Scan the QR code with your phone to use it as a wireless remote control
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!script.trim()}
            className="w-full py-4 rounded-xl bg-linear-to-r from-cyan-500 to-cyan-500 text-white font-semibold text-lg shadow-lg hover:from-cyan-500 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-cyan-500"
          >
            Start Teleprompter
          </button>

          {/* Instructions */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
            <h3 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-3">
              Keyboard Controls
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-cyan-800 dark:text-cyan-200">
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded-sm border border-cyan-300 dark:border-cyan-600 font-mono text-xs">
                  Space
                </kbd>{' '}
                Play / Pause
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded-sm border border-cyan-300 dark:border-cyan-600 font-mono text-xs">
                  ↑ ↓
                </kbd>{' '}
                Adjust Speed
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded-sm border border-cyan-300 dark:border-cyan-600 font-mono text-xs">
                  Home
                </kbd>{' '}
                Reset to Start
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded-sm border border-cyan-300 dark:border-cyan-600 font-mono text-xs">
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
