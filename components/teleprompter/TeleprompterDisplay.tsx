'use client';

import React, { useEffect, useRef } from 'react';
import { Play, Pause, X, RotateCcw, Type, FlipHorizontal2 } from 'lucide-react';

interface TeleprompterDisplayProps {
  script: string;
  isPlaying: boolean;
  scrollPosition: number;
  speedMultiplier: number;
  textSize: number;
  isMirrored: boolean;
  elapsedTime: number;
  estimatedTotalTime: number;
  onTogglePlayPause: () => void;
  onAdjustSpeed: (delta: number) => void;
  onAdjustTextSize: (delta: number) => void;
  onToggleMirror: () => void;
  onReset: () => void;
  onExit: () => void;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Text size configurations (1=smallest, 7=largest)
const TEXT_SIZE_CONFIG = {
  1: { size: 'text-3xl', label: 'XS' },
  2: { size: 'text-4xl', label: 'Small' },
  3: { size: 'text-5xl', label: 'Medium' },
  4: { size: 'text-6xl', label: 'Large' },
  5: { size: 'text-7xl', label: 'XL' },
  6: { size: 'text-8xl', label: '2XL' },
  7: { size: 'text-9xl', label: '3XL' },
};

export const TeleprompterDisplay: React.FC<TeleprompterDisplayProps> = ({
  script,
  isPlaying,
  scrollPosition,
  speedMultiplier,
  textSize,
  isMirrored,
  elapsedTime,
  estimatedTotalTime,
  onTogglePlayPause,
  onAdjustSpeed,
  onAdjustTextSize,
  onToggleMirror,
  onReset,
  onExit,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = React.useState(true);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll the content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Hide controls during playback after mouse stops moving
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      if (isPlaying) {
        hideControlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 2000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  // Split script into lines for processing
  const lines = script.split('\n');
  const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
  
  // Get text size configuration
  const sizeConfig = TEXT_SIZE_CONFIG[textSize as keyof typeof TEXT_SIZE_CONFIG] || TEXT_SIZE_CONFIG[3];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar with timing and controls */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-b from-black/90 to-transparent p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* Timing info */}
            <div className="flex items-center gap-6 text-white">
              <div className="text-sm">
                <span className="text-gray-400">Elapsed:</span>{' '}
                <span className="font-mono font-semibold text-white">{formatTime(elapsedTime)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Remaining:</span>{' '}
                <span className="font-mono font-semibold text-white">{formatTime(remainingTime)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Speed:</span>{' '}
                <span className="font-mono font-semibold text-white">{speedMultiplier.toFixed(1)}x</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Text:</span>{' '}
                <span className="font-mono font-semibold text-white">{sizeConfig.label}</span>
              </div>
            </div>

            {/* Exit button */}
            <button
              onClick={onExit}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Exit (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling script content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          scrollBehavior: 'auto',
          transform: isMirrored ? 'scaleX(-1)' : 'none',
        }}
      >
        {/* Top padding for viewport centering */}
        <div className="h-[45vh]"></div>

        {/* Script content */}
        <div className="max-w-4xl mx-auto px-8">
          {lines.map((line, index) => (
            <p
              key={index}
              className={`text-center transition-all duration-300 leading-relaxed mb-6 font-semibold ${sizeConfig.size}`}
              style={{
                minHeight: '60px',
                color: '#FFFFFF',
              }}
            >
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {/* Bottom padding */}
        <div className="h-[55vh]"></div>
      </div>

      {/* Bottom control bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(to top, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 50%, rgba(0, 0, 0, 0.9) 70%, rgba(0, 0, 0, 0.5) 85%, transparent 100%)'
        }}
      >
        <div className="p-3 sm:p-6 pb-safe">
          <div className="max-w-5xl mx-auto">
            {/* Control buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={onReset}
                className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white flex-shrink-0"
                title="Reset to beginning (Home)"
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={onToggleMirror}
                className={`p-3 rounded-lg transition-colors text-white flex-shrink-0 ${
                  isMirrored ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Mirror mode for physical teleprompters (M)"
              >
                <FlipHorizontal2 size={20} />
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onAdjustSpeed(-0.1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                  title="Slow down (Arrow Down)"
                >
                  −
                </button>
                <button
                  onClick={() => onAdjustSpeed(0.1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                  title="Speed up (Arrow Up)"
                >
                  +
                </button>
              </div>

              <button
                onClick={onTogglePlayPause}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors text-white shadow-lg flex-shrink-0"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onAdjustTextSize(-1)}
                  disabled={textSize <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Decrease text size (-)"
                >
                  <Type size={16} />
                </button>
                <button
                  onClick={() => onAdjustTextSize(1)}
                  disabled={textSize >= 7}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Increase text size (+)"
                >
                  <Type size={16} />
                </button>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-3 text-center text-gray-400 text-xs sm:text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
              <span className="inline-block mx-1 sm:mx-2">Space: Play/Pause</span>
              <span className="inline-block mx-1 sm:mx-2">↑↓: Speed</span>
              <span className="inline-block mx-1 sm:mx-2">+−: Text</span>
              <span className="inline-block mx-1 sm:mx-2">M: Mirror</span>
              <span className="inline-block mx-1 sm:mx-2">Home: Reset</span>
              <span className="inline-block mx-1 sm:mx-2">Esc: Exit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
