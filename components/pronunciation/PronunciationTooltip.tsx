'use client';

import { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { IconButton } from '@/components/shell';

interface PronunciationTooltipProps {
  word: string;
  pronunciation: string;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Popover showing the ARPABET notation for a clicked word.
 * Closes on Escape or an outside click; the copy button puts the notation on the clipboard.
 */
export const PronunciationTooltip = ({
  word,
  pronunciation,
  position,
  onClose,
}: PronunciationTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // Slight delay so the click that opened the popover does not close it.
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Keep the popover inside the viewport.
  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tooltip.style.left = `${Math.max(8, position.x - rect.width)}px`;
    }
    if (rect.bottom > window.innerHeight) {
      tooltip.style.top = `${Math.max(8, position.y - rect.height - 10)}px`;
    }
  }, [position]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pronunciation);
    } catch {
      // Clipboard unavailable — the notation is still readable on screen.
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 w-[250px] border border-ink bg-panel shadow-[0_8px_24px_rgba(19,19,19,0.14)]"
      style={{ left: `${position.x}px`, top: `${position.y + 8}px` }}
      role="dialog"
      aria-label={`Pronunciation for ${word}`}
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-[10px]">
        <span className="text-[13px] font-semibold text-ink">{word}</span>
        <IconButton
          icon={Copy}
          label="Copy pronunciation"
          iconSize={13}
          className="h-5 w-5 self-center"
          onClick={handleCopy}
        />
      </div>
      <div className="px-3 py-[10px]">
        <div className="text-[14px] font-medium tracking-[0.04em] text-ink">{pronunciation}</div>
        <div className="mt-[6px] text-[10px] tracking-[0.1em] text-muted">
          ARPABET · NORTH AMERICAN ENGLISH
        </div>
      </div>
    </div>
  );
};
