'use client';

import React, { useEffect, useRef } from 'react';
import { Copy, Volume2 } from 'lucide-react';

interface PronunciationTooltipProps {
  word: string;
  pronunciation: string;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * PronunciationTooltip Component
 * 
 * Displays a subtle, professional tooltip showing the phonetic pronunciation
 * of a word when clicked. Designed for voice actors to quickly check pronunciations.
 * 
 * Features:
 * - Positioned near the clicked word
 * - Shows word and ARPABET pronunciation
 * - Copy to clipboard functionality
 * - Keyboard accessible (Escape to close)
 * - Auto-positions to stay within viewport
 */
export const PronunciationTooltip: React.FC<PronunciationTooltipProps> = ({
  word,
  pronunciation,
  position,
  onClose
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close from the click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Auto-position tooltip to stay within viewport
  useEffect(() => {
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if tooltip goes off-screen
      if (rect.right > viewportWidth) {
        tooltip.style.left = `${position.x - rect.width}px`;
      }

      // Adjust vertical position if tooltip goes off-screen
      if (rect.bottom > viewportHeight) {
        tooltip.style.top = `${position.y - rect.height - 10}px`;
      }
    }
  }, [position]);

  // Copy pronunciation to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pronunciation);
      // Could add a brief "Copied!" indicator here if desired
    } catch (err) {
      console.error('Failed to copy pronunciation:', err);
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[200px] max-w-[300px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`,
      }}
      role="tooltip"
      aria-label={`Pronunciation for ${word}`}
    >
      {/* Word */}
      <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
        {word}
      </div>

      {/* Pronunciation in ARPABET */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm text-slate-600 dark:text-slate-300 flex-1">
          {pronunciation}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Copy pronunciation"
          aria-label="Copy pronunciation to clipboard"
        >
          <Copy size={14} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Format label */}
      <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
        ARPABET • North American English
      </div>
    </div>
  );
};
