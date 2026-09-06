'use client';

import React, { useEffect, useRef } from 'react';
import { Play, Pause, Square, X, RotateCcw, Type, FlipHorizontal2 } from 'lucide-react';

interface TeleprompterDisplayProps {
  script: string;
  isPlaying: boolean;
  scrollPosition: number;
  speedMultiplier: number;
  textSize: number;
  isMirrored: boolean;
  elapsedTime: number;
  estimatedTotalTime: number;
  /** Whole seconds remaining in the pre-roll countdown, or null when not counting down. */
  countdown: number | null;
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

/**
 * Text size configurations (1=smallest, 7=largest).
 * `px` scales the design's 46px default (size 3) across the hook's seven steps.
 */
const TEXT_SIZE_CONFIG = {
  1: { px: 29, short: 'XS', label: 'XS' },
  2: { px: 35, short: 'S', label: 'SMALL' },
  3: { px: 46, short: 'M', label: 'MED' },
  4: { px: 58, short: 'L', label: 'LARGE' },
  5: { px: 69, short: 'XL', label: 'XL' },
  6: { px: 92, short: '2XL', label: '2XL' },
  7: { px: 123, short: '3XL', label: '3XL' },
};

const BORDER = '#333';

const stageButton =
  'flex items-center justify-center border border-[#333] bg-transparent text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40';

const groupButton =
  'flex h-11 w-11 items-center justify-center border-none bg-transparent text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40';

export const TeleprompterDisplay: React.FC<TeleprompterDisplayProps> = ({
  script,
  isPlaying,
  scrollPosition,
  speedMultiplier,
  textSize,
  isMirrored,
  elapsedTime,
  estimatedTotalTime,
  countdown,
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
  const progress = estimatedTotalTime > 0 ? Math.min(1, elapsedTime / estimatedTotalTime) : 0;

  // Get text size configuration
  const sizeConfig = TEXT_SIZE_CONFIG[textSize as keyof typeof TEXT_SIZE_CONFIG] || TEXT_SIZE_CONFIG[3];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage">
      {/* Top overlay: timings and exit */}
      <div
        className={`absolute top-0 right-0 left-0 z-10 flex h-11 items-center justify-between gap-4 px-5 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0))' }}
      >
        <div className="scrollbar-hide flex gap-4 overflow-x-auto text-[11px] whitespace-nowrap text-[#B9BCC2] md:gap-6">
          <span>
            ELAPSED <span className="font-semibold text-white">{formatTime(elapsedTime)}</span>
          </span>
          <span>
            REMAINING <span className="font-semibold text-white">{formatTime(remainingTime)}</span>
          </span>
          <span>
            SPEED <span className="font-semibold text-white">{speedMultiplier.toFixed(1)}×</span>
          </span>
          <span>
            TEXT <span className="font-semibold text-white">{sizeConfig.short}</span>
          </span>
          <span>
            MIRROR <span className="font-semibold text-white">{isMirrored ? 'ON' : 'OFF'}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit fullscreen"
          title="Exit (Esc)"
          className={`h-[26px] w-[26px] shrink-0 ${stageButton}`}
        >
          <X width={14} height={14} aria-hidden="true" />
        </button>
      </div>

      {/* Progress line */}
      <div className="absolute top-0 right-0 left-0 z-20 h-[2px] bg-[#262626]">
        <div className="h-[2px] bg-white" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Scrolling script content */}
      <div
        ref={contentRef}
        className="scrollbar-hide flex-1 overflow-y-auto transition-opacity duration-300"
        style={{
          scrollBehavior: 'auto',
          transform: isMirrored ? 'scaleX(-1)' : 'none',
          opacity: countdown !== null ? 0.5 : 1,
        }}
      >
        {/* Top padding for viewport centering */}
        <div className="h-[45vh]"></div>

        {/* Script content */}
        <div className="mx-auto max-w-[720px] px-6 md:px-[60px]">
          {lines.map((line, index) => (
            <p
              key={index}
              className="mb-6 text-center text-white transition-all duration-300"
              style={{
                fontSize: `${sizeConfig.px}px`,
                lineHeight: 1.4,
                fontWeight: 500,
                minHeight: '60px',
              }}
            >
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {/* Bottom padding */}
        <div className="h-[55vh]"></div>
      </div>

      {/* Pre-roll countdown overlay */}
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#0A0A0A]/70 backdrop-blur-lg">
          <span className="text-[11px] tracking-[0.16em] text-[#8A8D93]">GET READY</span>
          <span className="text-[160px] leading-none font-semibold text-white tabular-nums">
            {countdown}
          </span>
        </div>
      )}

      {/* Bottom control bar */}
      <div
        className={`absolute right-0 bottom-0 left-0 z-10 p-5 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(to top, #0A0A0A 0%, #0A0A0A 55%, rgba(10,10,10,0) 100%)',
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-[10px]">
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset to beginning"
            title="Reset to beginning (Home)"
            className={`h-11 w-11 ${stageButton}`}
          >
            <RotateCcw width={18} height={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleMirror}
            aria-pressed={isMirrored}
            aria-label="Mirror"
            title="Mirror mode for physical teleprompters (M)"
            className={`h-11 w-11 ${stageButton}`}
          >
            <FlipHorizontal2 width={18} height={18} aria-hidden="true" />
          </button>

          <div className="flex border" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => onAdjustSpeed(-0.1)}
              aria-label="Slow down"
              title="Slow down (Arrow Down)"
              className={`${groupButton} text-[16px]`}
            >
              −
            </button>
            <span
              className="flex h-11 w-16 items-center justify-center border-x text-[12px] font-semibold text-white"
              style={{ borderColor: BORDER }}
            >
              {speedMultiplier.toFixed(1)}×
            </span>
            <button
              type="button"
              onClick={() => onAdjustSpeed(0.1)}
              aria-label="Speed up"
              title="Speed up (Arrow Up)"
              className={`${groupButton} text-[16px]`}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={countdown !== null ? 'Cancel countdown' : isPlaying ? 'Pause' : 'Play'}
            title={countdown !== null ? 'Cancel countdown (Space)' : 'Play/Pause (Space)'}
            className="flex h-14 w-14 shrink-0 items-center justify-center border-none bg-white text-stage"
          >
            {countdown !== null ? (
              <Square width={22} height={22} className="fill-current" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause width={22} height={22} className="fill-current" aria-hidden="true" />
            ) : (
              <Play width={22} height={22} className="fill-current" aria-hidden="true" />
            )}
          </button>

          <div className="flex border" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => onAdjustTextSize(-1)}
              disabled={textSize <= 1}
              aria-label="Decrease text size"
              title="Decrease text size (-)"
              className={groupButton}
            >
              <Type width={14} height={14} aria-hidden="true" />
            </button>
            <span
              className="flex h-11 w-16 items-center justify-center border-x text-[12px] font-semibold text-white"
              style={{ borderColor: BORDER }}
            >
              {sizeConfig.label}
            </span>
            <button
              type="button"
              onClick={() => onAdjustTextSize(1)}
              disabled={textSize >= 7}
              aria-label="Increase text size"
              title="Increase text size (+)"
              className={groupButton}
            >
              <Type width={19} height={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3 hidden text-center text-[10px] tracking-[0.08em] text-[#8A8D93] md:block">
          SPACE PLAY · ↑↓ SPEED · +− TEXT · M MIRROR · HOME RESET · ESC EXIT
        </div>
      </div>
    </div>
  );
};
